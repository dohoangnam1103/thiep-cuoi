"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Expand,
  Monitor,
  Pause,
  Play,
  Save,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { SlideshowMusicPicker } from "@/components/slideshow/editor/music-picker";
import {
  demoWeddingSlideshowSource,
  type WeddingSlideshowSource,
} from "@/components/slideshow/core/source";
import type {
  SlideshowFormat,
  SlideshowMediaKind,
  SlideshowScene,
} from "@/components/slideshow/core/types";
import {
  slideshowTemplateById,
  slideshowTemplateCatalog,
  type SlideshowTemplateId,
} from "@/components/slideshow/templates/catalog";
import { SlideshowComposition } from "@/components/slideshow/templates/loaders";
import { createSlideshowStoryboard } from "@/components/slideshow/templates/storyboards";
import {
  applySceneOverrides,
  sceneOverrideGroupKey,
  type SlideshowEntitlement,
  type SlideshowProjectDraft,
} from "@/lib/slideshow/project";

import { saveSlideshowProject } from "./actions";

export type SlideshowStudioProject = {
  id: string;
  title: string;
  shareToken: string;
  draft: SlideshowProjectDraft;
  revision: number;
  entitlement: SlideshowEntitlement;
  trialEndsAt: string;
};

export type SlideshowProjectSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type SlideshowStudioProps = {
  mode?: "demo" | "editor" | "viewer";
  project?: SlideshowStudioProject;
  projects?: SlideshowProjectSummary[];
  initialTemplateId?: SlideshowTemplateId;
};

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";

const demoDraft: SlideshowProjectDraft = {
  templateId: "cinematic",
  templateVersion: slideshowTemplateById.cinematic.version,
  source: demoWeddingSlideshowSource,
  sceneOverrides: {},
  musicUrl: "",
};

export function SlideshowStudio({
  mode = "demo",
  project,
  projects = [],
  initialTemplateId = "cinematic",
}: SlideshowStudioProps) {
  const t = useTranslations("slideshowStudio");
  const [draft, setDraft] = useState<SlideshowProjectDraft>(() => project?.draft ?? {
    ...demoDraft,
    templateId: initialTemplateId,
    templateVersion: slideshowTemplateById[initialTemplateId].version,
  });
  const [format, setFormat] = useState<SlideshowFormat>("tv");
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const soundtrackRef = useRef<HTMLAudioElement>(null);
  const revisionRef = useRef(0);
  const persistedLocalRevisionRef = useRef(0);
  const serverRevisionRef = useRef(project?.revision ?? 0);
  const pendingSaveRef = useRef<{
    snapshot: SlideshowProjectDraft;
    localRevision: number;
  } | null>(null);
  const saveInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const editable = mode === "editor" && Boolean(project) && project?.entitlement !== "expired";
  const template = slideshowTemplateById[draft.templateId];

  const scenes = useMemo(() => applySceneOverrides(
    createSlideshowStoryboard(draft.templateId, draft.source, draft.templateVersion),
    draft.sceneOverrides,
    draft.templateId,
    draft.templateVersion,
  ), [draft]);
  const activeScene = scenes[activeIndex] ?? scenes[0];
  const sceneDurationMs = Math.max(1_000, Math.round(template.durationMs / scenes.length));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const commitDraft = useCallback((update: (current: SlideshowProjectDraft) => SlideshowProjectDraft) => {
    setDraft((current) => update(current));
    if (editable) {
      revisionRef.current += 1;
      setSaveState("dirty");
    }
  }, [editable]);

  const startSaveQueue = useCallback(function drainSaveQueue() {
    if (!project || !editable || saveInFlightRef.current) return;
    saveInFlightRef.current = true;
    void (async () => {
      let restartOnExit = true;
      try {
        while (pendingSaveRef.current && mountedRef.current) {
          const pending = pendingSaveRef.current;
          pendingSaveRef.current = null;
          if (pending.localRevision <= persistedLocalRevisionRef.current) {
            setSaveState(
              revisionRef.current <= persistedLocalRevisionRef.current
                ? "saved"
                : "dirty",
            );
            continue;
          }
          setSaveState("saving");

          let result: Awaited<ReturnType<typeof saveSlideshowProject>> | null = null;
          for (let attempt = 0; attempt < 3 && !result; attempt += 1) {
            try {
              result = await saveSlideshowProject(
                project.id,
                serverRevisionRef.current,
                pending.snapshot,
              );
            } catch {
              if (attempt < 2) {
                await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)));
              }
            }
          }

          if (!mountedRef.current) return;
          if (!result) {
            // Giữ snapshot mới nhất để nút Lưu có thể thử lại khi mạng hồi.
            pendingSaveRef.current ??= pending;
            restartOnExit = false;
            setSaveState("error");
            return;
          }
          if (!result.ok) {
            // CAS conflict không được tự nâng revision rồi ghi đè dữ liệu của tab
            // khác. Người dùng chủ động tải lại để lấy bản server mới nhất.
            restartOnExit = false;
            setSaveState(result.error === "conflict" ? "conflict" : "error");
            if (result.error === "expired") {
              window.location.assign(`/trinh-chieu/${project.id}/thanh-toan`);
            }
            return;
          }
          serverRevisionRef.current = result.revision;
          persistedLocalRevisionRef.current = Math.max(
            persistedLocalRevisionRef.current,
            pending.localRevision,
          );
          setSaveState(
            revisionRef.current === pending.localRevision && !pendingSaveRef.current
              ? "saved"
              : "dirty",
          );
        }
      } finally {
        saveInFlightRef.current = false;
        if (restartOnExit && pendingSaveRef.current && mountedRef.current) drainSaveQueue();
      }
    })();
  }, [editable, project]);

  const enqueuePersist = useCallback((snapshot: SlideshowProjectDraft, localRevision: number) => {
    if (!project || !editable) return;
    if (localRevision <= persistedLocalRevisionRef.current) {
      setSaveState("saved");
      return;
    }
    pendingSaveRef.current = { snapshot, localRevision };
    startSaveQueue();
  }, [editable, project, startSaveQueue]);

  useEffect(() => {
    if (saveState !== "dirty" || !project || !editable) return;
    const localRevision = revisionRef.current;
    const snapshot = draft;
    const timer = window.setTimeout(() => {
      enqueuePersist(snapshot, localRevision);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [draft, editable, enqueuePersist, project, saveState]);

  useEffect(() => {
    function preventDirtyExit(event: BeforeUnloadEvent) {
      if (persistedLocalRevisionRef.current === revisionRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", preventDirtyExit);
    return () => window.removeEventListener("beforeunload", preventDirtyExit);
  }, []);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, scenes.length - 1)));
  }, [scenes.length]);

  const goTo = useCallback((index: number) => {
    if (!scenes.length) return;
    setActiveIndex((index + scenes.length) % scenes.length);
  }, [scenes.length]);

  useEffect(() => {
    if (!playing || !scenes.length) return;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % scenes.length);
    }, sceneDurationMs);
    return () => window.clearTimeout(timer);
  }, [activeIndex, playing, sceneDurationMs, scenes.length]);

  useEffect(() => {
    const audio = soundtrackRef.current;
    if (!audio) return;
    if (!playing || !draft.musicUrl) {
      audio.pause();
      return;
    }
    if (audio.src !== new URL(draft.musicUrl, window.location.origin).href) {
      audio.src = draft.musicUrl;
    }
    audio.loop = true;
    void audio.play().catch(() => undefined);
  }, [draft.musicUrl, playing]);

  function changeTemplate(templateId: SlideshowTemplateId) {
    const next = slideshowTemplateById[templateId];
    commitDraft((current) => ({
      ...current,
      templateId,
      templateVersion: next.version,
    }));
    setActiveIndex(0);
    setPlaying(false);
  }

  function updateSource(update: (source: WeddingSlideshowSource) => WeddingSlideshowSource) {
    commitDraft((current) => ({ ...current, source: update(current.source) }));
  }

  function updateScene(field: "title" | "caption", value: string) {
    const groupKey = sceneOverrideGroupKey(draft.templateId, draft.templateVersion);
    commitDraft((current) => ({
      ...current,
      sceneOverrides: {
        ...current.sceneOverrides,
        [groupKey]: {
          ...(current.sceneOverrides[groupKey] ?? {}),
          [String(activeScene.id)]: {
            ...(current.sceneOverrides[groupKey]?.[String(activeScene.id)] ?? {}),
            [field]: value,
          },
        },
      },
    }));
  }

  async function uploadMedia(event: ChangeEvent<HTMLInputElement>) {
    const remaining = Math.max(0, template.capabilities.maxPhotos - draft.source.photos.length);
    const files = [...(event.target.files ?? [])].slice(0, remaining);
    event.target.value = "";
    if (!project || !editable || !files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const file of files) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(`/api/slideshows/${project.id}/assets`, {
          method: "POST",
          body,
        });
        const data = await response.json() as {
          id?: string;
          url?: string;
          kind?: SlideshowMediaKind;
          alt?: string;
          error?: string;
        };
        if (!response.ok || !data.id || !data.url || !data.kind) {
          throw new Error(data.error ?? "uploadFailed");
        }
        updateSource((source) => ({
          ...source,
          photos: [...source.photos, {
            id: data.id,
            url: data.url!,
            kind: data.kind!,
            alt: data.alt ?? file.name,
          }],
        }));
      }
    } catch {
      setUploadError("Không thể tải tệp này. Hỗ trợ ảnh, MP4, MOV và WebM.");
    } finally {
      setUploading(false);
    }
  }

  async function copyShareLink() {
    if (!project) return;
    const url = `${window.location.origin}/trinh-chieu/xem/${project.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setCopied(false);
    }
  }

  async function enterFullscreen() {
    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      // Fullscreen can be denied by in-app browsers; preview remains usable.
    }
  }

  const saveLabel = saveState === "saving"
    ? "Đang lưu…"
    : saveState === "dirty"
      ? "Chưa lưu"
      : saveState === "conflict"
        ? t("conflict")
        : saveState === "error"
          ? "Lưu thất bại"
          : t("saved");

  return (
    <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_50%_-20%,#35342f_0%,#191916_35%,#11110f_72%)]">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <Link href="/trinh-chieu" className="flex min-w-0 items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#d8ff3e]/40 bg-[#d8ff3e]/10 text-xs font-semibold text-[#d8ff3e]">CM</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">{t("studioName")}</p>
            <p className="truncate text-xs text-white/45">{project?.title ?? t("demoSubtitle")}</p>
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {mode === "editor" && project ? (
            <>
              <Link href="/trinh-chieu/du-an" className="hidden h-9 items-center rounded-full border border-white/12 px-3 text-sm text-white/60 hover:bg-white/8 hover:text-white sm:inline-flex">
                {t("myProjects")}
              </Link>
              <span className={`hidden text-xs sm:inline ${saveState === "error" ? "text-red-300" : "text-white/40"}`}>{saveLabel}</span>
              {project.entitlement !== "expired" ? (
                <button type="button" onClick={() => void copyShareLink()} className="inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-sm text-white/70 hover:bg-white/8">
                  {copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Đã chép" : "Link xem"}
                </button>
              ) : null}
              {editable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (saveState === "conflict") {
                      window.location.reload();
                      return;
                    }
                    enqueuePersist(draft, revisionRef.current);
                  }}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-white/12 px-3 text-sm font-medium text-white/75 hover:bg-white/8"
                >
                  <Save size={15} strokeWidth={1.75} />
                  {saveState === "conflict" ? t("reload") : t("save")}
                </button>
              ) : (
                <Link href={`/trinh-chieu/${project.id}/thanh-toan`} className="h-9 rounded-full bg-[#d8ff3e] px-4 py-2 text-sm font-semibold text-black">Mở khóa 199.000đ</Link>
              )}
            </>
          ) : mode === "demo" ? (
            <>
              <Link href="/trinh-chieu/mau" className="hidden h-9 rounded-full px-3 py-2 text-sm text-white/55 hover:bg-white/8 hover:text-white sm:block">
                {t("templateGallery")}
              </Link>
              <Link href="/trinh-chieu/du-an" className="h-9 rounded-full border border-white/12 px-3 py-2 text-sm text-white/65 hover:bg-white/8 hover:text-white">
                {t("myProjects")}
              </Link>
              <Link href={`/trinh-chieu/bat-dau?template=${draft.templateId}`} className="h-9 rounded-full bg-[#d8ff3e] px-4 py-2 text-sm font-semibold text-[#171811] hover:bg-[#e2ff73]">{t("startTrial")}</Link>
            </>
          ) : null}
        </div>
      </header>

      {mode === "editor" && project?.entitlement === "trial" ? (
        <div className="border-b border-[#d8ff3e]/20 bg-[#d8ff3e]/8 px-4 py-2.5 text-center text-xs text-white/60">
          Đang dùng thử miễn phí · chỉnh sửa đến {new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(project.trialEndsAt))}
        </div>
      ) : null}
      {mode === "editor" && project?.entitlement === "expired" ? (
        <div className="border-b border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-100">
          Thời gian dùng thử đã kết thúc. Bạn vẫn xem được bản nháp; thanh toán 199.000đ để chỉnh sửa và mở lại link công khai.
        </div>
      ) : null}

      <div className="grid min-h-[calc(100dvh-4rem)] lg:grid-cols-[270px_minmax(0,1fr)_320px]">
        <aside className="order-2 border-t border-white/10 bg-black/10 p-4 lg:order-1 lg:border-r lg:border-t-0">
          {mode === "demo" && projects.length ? (
            <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("myProjects")}</p>
                <Link href="/trinh-chieu/du-an" className="shrink-0 text-xs font-medium text-[#d8ff3e] hover:text-[#e2ff73]">{t("viewAllProjects")}</Link>
              </div>
              <div className="mt-2 space-y-1">
                {projects.slice(0, 4).map((item) => <Link key={item.id} href={`/trinh-chieu/${item.id}`} className="block truncate rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/8 hover:text-white">{item.title}</Link>)}
              </div>
            </div>
          ) : null}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">{t("story")}</p>
            <span className="text-[11px] text-white/30">{Math.round(template.durationMs / 1_000)} giây</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {scenes.map((scene, index) => (
              <button key={scene.id} type="button" onClick={() => goTo(index)} className={`group grid grid-cols-[72px_1fr] items-center gap-3 rounded-xl border p-2 text-left transition ${activeIndex === index ? "border-[#d8ff3e]/55 bg-[#d8ff3e]/8" : "border-transparent hover:border-white/10 hover:bg-white/5"}`}>
                <SceneThumbnail scene={scene} index={index} />
                <span className="min-w-0"><span className="block truncate text-sm font-medium text-white/85">{scene.title}</span><span className="mt-1 block truncate text-xs text-white/35">{Math.round(sceneDurationMs / 1_000)} {t("seconds")}</span></span>
              </button>
            ))}
          </div>
        </aside>

        <section className="order-1 flex min-w-0 flex-col px-4 py-5 sm:px-6 lg:order-2 lg:px-8 lg:py-7">
          <div id="chon-mau" className="mb-5 flex scroll-mt-20 flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                <FormatButton active={format === "tv"} onClick={() => setFormat("tv")} icon={<Monitor size={15} />} label={t("tv")} />
                <FormatButton active={format === "phone"} onClick={() => setFormat("phone")} icon={<Smartphone size={15} />} label={t("phone")} />
              </div>
              {mode !== "viewer" ? (
                <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1">
                  {slideshowTemplateCatalog.map((item) => (
                    <button key={item.id} type="button" onClick={() => changeTemplate(item.id)} className={`h-8 rounded-full px-3 text-xs font-medium transition ${draft.templateId === item.id ? "bg-white/12 text-white" : "text-white/45 hover:text-white"}`}>{t(item.nameKey)}</button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-white/35">{format === "tv" ? "1920 × 1080 · 16:9" : "1080 × 1920 · 9:16"}</p>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div ref={stageRef} className={`group relative isolate w-full overflow-hidden bg-black shadow-[0_35px_100px_rgba(0,0,0,0.55)] transition-[max-width,aspect-ratio] duration-500 ${format === "tv" ? "aspect-video max-w-5xl rounded-xl" : "aspect-[9/16] max-h-[68dvh] max-w-[380px] rounded-[28px]"}`}>
              <SlideshowComposition activeIndex={activeIndex} format={format} playing={playing} scenes={scenes} templateId={draft.templateId} templateVersion={draft.templateVersion} />
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <ControlButton onClick={() => goTo(activeIndex - 1)} label={t("previous")}><ChevronLeft size={17} /></ControlButton>
                <button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? t("pause") : t("play")} className="grid size-9 place-items-center rounded-full bg-[#d8ff3e] text-black active:scale-[0.95]">{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
                <ControlButton onClick={() => goTo(activeIndex + 1)} label={t("next")}><ChevronRight size={17} /></ControlButton>
                <ControlButton onClick={() => void enterFullscreen()} label={t("fullscreen")}><Expand size={16} /></ControlButton>
              </div>
            </div>
          </div>
        </section>

        <aside className="order-3 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-black/10 p-5 lg:border-l lg:border-t-0">
          {editable ? (
            <EditorPanel
              activeScene={activeScene}
              draft={draft}
              onMusic={(musicUrl) => commitDraft((current) => ({ ...current, musicUrl }))}
              onRemoveMedia={(index) => updateSource((source) => ({ ...source, photos: source.photos.filter((_, mediaIndex) => mediaIndex !== index) }))}
              onScene={updateScene}
              onSource={updateSource}
              onUpload={uploadMedia}
              uploadError={uploadError}
              uploading={uploading}
            />
          ) : (
            <ReadOnlyPanel mode={mode} project={project} templateId={draft.templateId} />
          )}
        </aside>
      </div>
      <audio ref={soundtrackRef} preload="none" />
    </main>
  );
}

function EditorPanel({
  activeScene,
  draft,
  onMusic,
  onRemoveMedia,
  onScene,
  onSource,
  onUpload,
  uploadError,
  uploading,
}: {
  activeScene: SlideshowScene;
  draft: SlideshowProjectDraft;
  onMusic: (value: string) => void;
  onRemoveMedia: (index: number) => void;
  onScene: (field: "title" | "caption", value: string) => void;
  onSource: (update: (source: WeddingSlideshowSource) => WeddingSlideshowSource) => void;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadError: string;
  uploading: boolean;
}) {
  const inputClass = "h-10 w-full rounded-lg border border-white/12 bg-white/5 px-3 text-sm text-white outline-none focus:border-[#d8ff3e]/60 focus:ring-2 focus:ring-[#d8ff3e]/15";
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-base font-semibold tracking-tight">Thông tin chính</h2>
        <p className="mt-1 text-xs leading-relaxed text-white/40">Chỉ cần tên và ảnh. Các phần còn lại đã có nội dung mặc định.</p>
        <div className="mt-4 grid gap-3">
          <Field label="Tên cô dâu"><input value={draft.source.couple.brideName} onChange={(event) => onSource((source) => ({ ...source, couple: { ...source.couple, brideName: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Tên chú rể"><input value={draft.source.couple.groomName} onChange={(event) => onSource((source) => ({ ...source, couple: { ...source.couple, groomName: event.target.value } }))} className={inputClass} /></Field>
        </div>
      </section>

      <section className="border-t border-white/10 pt-5">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Ảnh và video</h2><span className="text-xs text-white/35">{draft.source.photos.length}</span></div>
        <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/4 px-3 py-3 text-sm text-white/65 hover:border-[#d8ff3e]/50 hover:text-white">
          <Upload size={16} />{uploading ? "Đang tải…" : "Tải ảnh hoặc video"}
          <input type="file" multiple disabled={uploading} accept="image/*,video/mp4,video/quicktime,video/webm,.mov" onChange={(event) => void onUpload(event)} className="sr-only" />
        </label>
        {uploadError ? <p className="mt-2 text-xs text-red-300">{uploadError}</p> : null}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {draft.source.photos.map((media, index) => (
            <div key={media.id ?? `${media.url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg bg-white/5">
              {media.kind === "video" ? <video src={media.url} muted playsInline preload="metadata" className="size-full object-cover" /> : <Image src={media.url} alt={media.alt} fill unoptimized={media.url.startsWith("/api/slideshows/media/")} sizes="90px" className="object-cover" />}
              {draft.source.photos.length > 1 ? <button type="button" onClick={() => onRemoveMedia(index)} aria-label="Xóa tệp" className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/70 opacity-0 transition group-hover:opacity-100 focus:opacity-100"><X size={13} /></button> : null}
              {media.kind === "video" ? <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px]">VIDEO</span> : null}
            </div>
          ))}
        </div>
      </section>

      <details className="border-t border-white/10 pt-5">
        <summary className="cursor-pointer text-sm font-semibold text-white/75">Thông tin nâng cao</summary>
        <div className="mt-4 grid gap-3">
          <Field label="Ngày cưới"><input value={draft.source.event.dateLabel} onChange={(event) => onSource((source) => ({ ...source, event: { ...source.event, dateLabel: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Địa điểm"><input value={draft.source.event.locationLabel} onChange={(event) => onSource((source) => ({ ...source, event: { ...source.event, locationLabel: event.target.value } }))} className={inputClass} /></Field>
          <Field label="Mở đầu"><textarea value={draft.source.story.opening} onChange={(event) => onSource((source) => ({ ...source, story: { ...source.story, opening: event.target.value } }))} rows={2} className={`${inputClass} h-auto py-2`} /></Field>
          <Field label="Hành trình"><textarea value={draft.source.story.journey} onChange={(event) => onSource((source) => ({ ...source, story: { ...source.story, journey: event.target.value } }))} rows={3} className={`${inputClass} h-auto py-2`} /></Field>
          <Field label="Lời kết"><textarea value={draft.source.story.closing} onChange={(event) => onSource((source) => ({ ...source, story: { ...source.story, closing: event.target.value } }))} rows={3} className={`${inputClass} h-auto py-2`} /></Field>
        </div>
      </details>

      <section className="border-t border-white/10 pt-5">
        <h2 className="text-sm font-semibold">Tùy chỉnh cảnh đang chọn</h2>
        <div className="mt-3 grid gap-3">
          <Field label="Tiêu đề"><input value={activeScene.title} onChange={(event) => onScene("title", event.target.value)} className={inputClass} /></Field>
          <Field label="Chú thích"><textarea value={activeScene.caption} onChange={(event) => onScene("caption", event.target.value)} rows={3} className={`${inputClass} h-auto py-2`} /></Field>
        </div>
      </section>

      <section className="border-t border-white/10 pt-5"><SlideshowMusicPicker disabled={false} value={draft.musicUrl} onChange={onMusic} /></section>
      <div className="rounded-xl border border-[#d8ff3e]/20 bg-[#d8ff3e]/6 p-4"><p className="text-xs font-semibold text-[#d8ff3e]">Tự động cho mọi màn hình</p><p className="mt-1.5 text-xs leading-relaxed text-white/45">Một lần nhập nội dung sẽ tạo cả bản TV 16:9 và điện thoại 9:16.</p></div>
    </div>
  );
}

function ReadOnlyPanel({ mode, project, templateId }: { mode: "demo" | "editor" | "viewer"; project?: SlideshowStudioProject; templateId: SlideshowTemplateId }) {
  const template = slideshowTemplateById[templateId];
  return (
    <div>
      <h2 className="text-base font-semibold">Bản xem trước</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/45">Chuyển giữa TV và điện thoại để xem template tự dựng lại bố cục từ cùng một nội dung.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs uppercase tracking-[0.14em] text-white/35">Thời lượng mẫu</p><p className="mt-1 text-lg font-semibold">{Math.round(template.durationMs / 1_000)} giây</p><p className="mt-1 text-xs text-white/35">Ảnh và video được tự crop theo từng scene.</p></div>
      {mode === "demo" ? <Link href={`/trinh-chieu/bat-dau?template=${templateId}`} className="mt-5 block rounded-full bg-[#d8ff3e] px-4 py-3 text-center text-sm font-semibold text-black">Đăng nhập để tạo slideshow</Link> : null}
      {mode === "editor" && project?.entitlement === "expired" ? <Link href={`/trinh-chieu/${project.id}/thanh-toan`} className="mt-5 block rounded-full bg-[#d8ff3e] px-4 py-3 text-center text-sm font-semibold text-black">Thanh toán 199.000đ</Link> : null}
    </div>
  );
}

function SceneThumbnail({ scene, index }: { scene: SlideshowScene; index: number }) {
  return (
    <span className="relative block aspect-video overflow-hidden rounded-md bg-white/5">
      {scene.imageKind === "video" ? <video src={scene.image} muted playsInline preload="metadata" className="size-full object-cover" /> : <Image src={scene.image} alt={scene.imageAlt ?? ""} fill unoptimized={scene.image.startsWith("/api/slideshows/media/")} sizes="72px" className="object-cover grayscale-[20%]" />}
      <span className="absolute left-1 top-1 grid size-4 place-items-center rounded-full bg-black/65 text-[9px] text-white/80">{index + 1}</span>
    </span>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-white/50">{label}</span>{children}</label>;
}

function ControlButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-label={label} className="grid size-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm active:scale-[0.95]">{children}</button>;
}

function FormatButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium transition ${active ? "bg-white text-black" : "text-white/50 hover:text-white"}`}>{icon}{label}</button>;
}
