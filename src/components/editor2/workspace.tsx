"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, ChevronRight, Eye, LayoutTemplate, List, Monitor, Pencil, Plus, Redo2, Save, Smartphone, Undo2, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { saveVisualInvitation, requestVisualPublication, publishVisualInvitation } from "@/app/editor2/actions";
import { PublishSuccessDialog } from "@/app/editor/[id]/PublishSuccessDialog";
import { TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";
import type { EditorErrorCode } from "@/app/editor/[id]/content-schema";
import { EDITOR2_FIELD_GROUPS, EDITOR2_SECTIONS, editor2FormData, editor2MissingSections, isEditor2Section, withEditor2FullName, type Editor2Draft, type Editor2Samples, type Editor2Section } from "@/lib/editor2-draft";
import { cacheEditor2Basics, editor2Basics, restoreEditor2DraftBasics, writeEditor2Basics } from "@/lib/editor2-basics-storage";
import { acknowledgeEditor2Defaults, editor2DefaultFields, initializeEditor2Defaults } from "@/lib/editor2-defaults";
import { editor2PublicationIssue } from "@/lib/editor2-publication";
import { titleCaseVietnameseName } from "@/lib/text-case";
import { Editor2ClientReady } from "./client-ready";
import { Editor2DateField } from "./date-field";
import { Editor2SectionFields } from "./section-fields";
import { completedTemplates } from "@/data/chungdoi";
import type { ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { templatePreviewUrl } from "@/lib/template-preview-url";
import { heroImageCount, templateSupportsHeroImage } from "@/data/editor-template-capabilities";

function Editor2PreviewLoading() {
  const t = useTranslations("editor2");
  return <div className="e2-canvas-loading" role="status">{t("loading")}</div>;
}
const InlineInvitationPreview = dynamic(() => import("./invitation-preview").then(module => module.Editor2InvitationPreview), {
  ssr: false, loading: Editor2PreviewLoading,
});

type History = { past: Editor2Draft[]; present: Editor2Draft; future: Editor2Draft[] };
type HistoryAction = { type: "change"; update: (draft: Editor2Draft) => Editor2Draft } | { type: "undo" | "redo" };
function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "undo") return state.past.length ? { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] } : state;
  if (action.type === "redo") return state.future.length ? { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) } : state;
  if (action.type !== "change") return state;
  const present = action.update(state.present);
  return JSON.stringify(present) === JSON.stringify(state.present) ? state : { past: [...state.past.slice(-79), state.present], present, future: [] };
}

type Panel = Editor2Section | "content" | "add" | "basics" | "templates" | null;
const COMPACT_SCREEN_QUERY = "(max-width: 767px), (pointer: coarse)";

type Editor2WorkspaceProps = {
  id: string; initial: Editor2Draft; labels: Record<string, string>; currentSlug: string | null; status: string; isAccount: boolean; resumePublication?: boolean;
  base: ChungDoiDemoContent; samples: Record<string, Editor2Samples>; cover3dEnabled: boolean; hideBranding: boolean;
};

export function Editor2Workspace(props: Editor2WorkspaceProps) {
  return <Editor2ClientReady><Editor2WorkspaceBody {...props} /></Editor2ClientReady>;
}

function Editor2WorkspaceBody({ id, initial, labels, currentSlug, status, isAccount, base, samples, cover3dEnabled, hideBranding, resumePublication = false }: Editor2WorkspaceProps) {
  const router = useRouter();
  const t = useTranslations("editor2");
  const errorT = useTranslations("editor.errors");
  const defaultFields = editor2DefaultFields(key => t(`samples.${key}`));
  const [restored] = useState(() => initializeEditor2Defaults(id, restoreEditor2DraftBasics(id, initial), defaultFields, status === "published"));
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: restored, future: [] });
  const draft = history.present;
  const previewDraft = useDeferredValue(draft);
  const [compactScreen, setCompactScreen] = useState(() => typeof window !== "undefined" && window.matchMedia(COMPACT_SCREEN_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(COMPACT_SCREEN_QUERY);
    const update = () => setCompactScreen(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [{ panel, renderedPanel }, setDialog] = useState<{ panel: Panel; renderedPanel: Panel }>(() => {
    const initialPanel: Panel = !restored.fields.brideFullName || !restored.fields.groomFullName || !restored.fields.date ? "basics" : null;
    return { panel: initialPanel, renderedPanel: initialPanel };
  });
  // Base UI keeps the popup mounted through its exit transition. Keep its
  // fields and dimensions intact until it has finished fading out too.
  const setPanel = useCallback((next: Panel) => {
    setDialog(previous => ({ panel: next, renderedPanel: next ?? previous.renderedPanel }));
  }, []);
  const [editing, setEditing] = useState(true);
  const [phone, setPhone] = useState(false);
  const [hint, setHint] = useState(true);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "unsaved" | "saveError">(restored === initial ? "saved" : "unsaved");
  const [error, setError] = useState<EditorErrorCode | "networkError" | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publicationPending, setPublicationPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState(currentSlug);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const focusField = useRef<string | undefined>(undefined);
  const dialogBody = useRef<HTMLDivElement>(null);
  const baseline = useRef(JSON.stringify(initial));
  const basicsBaseline = useRef(editor2Basics(initial.fields));
  const latest = useRef(draft);
  const editingRef = useRef(editing);
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const snapshot = JSON.stringify(draft);

  useLayoutEffect(() => { latest.current = draft; editingRef.current = editing; }, [draft, editing]);
  const { brideFullName, groomFullName, date } = draft.fields;
  useLayoutEffect(() => {
    const values = { brideFullName, groomFullName, date };
    writeEditor2Basics(values);
    cacheEditor2Basics(id, values, basicsBaseline.current);
  }, [id, brideFullName, groomFullName, date]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); };
  }, []);

  const persist = useCallback((value: Editor2Draft) => {
    const serialized = JSON.stringify(value);
    queue.current = queue.current.catch(() => false).then(async () => {
      if (baseline.current === serialized) {
        if (mounted.current && JSON.stringify(latest.current) === serialized) { setSaveState("saved"); setError(null); }
        return true;
      }
      if (mounted.current) setSaveState("saving");
      try {
        const result = await saveVisualInvitation(id, editor2FormData(value));
        if (!result?.ok) {
          if (mounted.current) { setSaveState("saveError"); setError(result?.errorCode ?? "networkError"); }
          return false;
        }
        baseline.current = serialized;
        acknowledgeEditor2Defaults(id);
        basicsBaseline.current = {
          brideFullName: titleCaseVietnameseName(value.fields.brideFullName),
          groomFullName: titleCaseVietnameseName(value.fields.groomFullName),
          date: value.fields.date,
        };
        cacheEditor2Basics(id, editor2Basics(latest.current.fields), basicsBaseline.current);
        if (mounted.current) {
          setSaveState(JSON.stringify(latest.current) === serialized ? "saved" : "unsaved");
          setError(null);
        }
        return true;
      } catch {
        if (mounted.current) { setSaveState("saveError"); setError("networkError"); }
        return false;
      }
    });
    return queue.current;
  }, [id]);
  const selectSection = useCallback((section: Editor2Section, field?: string) => {
    if (!editingRef.current || locked.current) return;
    if (section === "photos" && !templateSupportsHeroImage(latest.current.fields.templateId)) return;
    focusField.current = field;
    setPanel(section);
  }, [setPanel]);

  useEffect(() => {
    if (snapshot === baseline.current) { acknowledgeEditor2Defaults(id); return; }
    if (publishing || uploading) return;
    timer.current = setTimeout(() => { void persist(draft); }, 1800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [id, snapshot, draft, persist, publishing, uploading]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (uploading || snapshot !== baseline.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [snapshot, uploading]);

  const initialDialogFocus = useCallback(() => {
    const input = focusField.current ? document.getElementById(`e2-${focusField.current}`)
      ?? document.getElementById(`e2-date-${focusField.current}`) : null;
    if (input && dialogBody.current?.contains(input)) {
      // Opening focus can run after the transition, even if publication has
      // already advanced to another panel. Keep its latest requested target.
      const details = input.closest("details");
      if (details) details.open = true;
      return input;
    }
    return true;
  }, []);
  const previousPanel = useRef(panel);
  useLayoutEffect(() => {
    const wasOpen = previousPanel.current !== null;
    previousPanel.current = panel;
    // The dialog manages focus when opening. Only move it ourselves when
    // replacing the fields inside an already open publication dialog.
    if (!publicationPending || !panel || !wasOpen) return;
    const input = initialDialogFocus();
    if (input !== true) input.focus();
  }, [panel, publicationPending, initialDialogFocus]);

  const change = (update: (previous: Editor2Draft) => Editor2Draft) => {
    dispatch({ type: "change", update }); setSaveState("unsaved"); setError(null);
  };
  const open = (value: Panel) => {
    if (locked.current || (value === "photos" && !templateSupportsHeroImage(latest.current.fields.templateId))) return;
    focusField.current = undefined; setPanel(value);
  };
  const saveNow = async () => {
    if (timer.current) clearTimeout(timer.current);
    if (JSON.stringify(latest.current) !== baseline.current) setSaveState("saving");
    return persist(latest.current);
  };
  const hideSection = () => {
    if (!panel || locked.current) return;
    change(previous => {
      if (panel === "album") return { ...previous, fields: { ...previous.fields, showAlbum: false }, gallery: [] };
      if (panel === "music") return { ...previous, fields: { ...previous.fields, music: "", musicTitle: "", musicArtist: "", musicStartAt: 0, musicEnabled: true } };
      if (panel === "ceremonies") return { ...previous, ceremonies: [] };
      if (panel === "schedule") return { ...previous, schedule: [] };
      if (panel === "photos") return { ...previous, fields: { ...previous.fields, showHeroImage: false } };
      if (panel === "gift") return { ...previous, fields: { ...previous.fields, ...Object.fromEntries(EDITOR2_FIELD_GROUPS.gift.map(key => [key, ""])) } };
      return previous;
    });
    setPanel(null);
  };
  const publishCurrent = async () => {
    const form = editor2FormData(latest.current);
    form.set("autoSlug", "true");
    if (publishedSlug) form.set("slug", publishedSlug);
    const result = await publishVisualInvitation(id, form);
    if (result && "loginUrl" in result) { router.push(result.loginUrl); return; }
    if (result?.errorCode) {
      setError(result.errorCode);
      const issue = editor2PublicationIssue(latest.current.fields, defaultFields);
      if (issue && issue.errorCode === result.errorCode) {
        focusField.current = issue.focusField;
        setPublicationPending(true); setPanel(issue.section);
      }
      return;
    }
    if (result?.publishedSlug) {
      setPublishedSlug(result.publishedSlug);
      setPublishSuccessOpen(true);
    }
  };
  const beginPublication = async () => {
    if (locked.current) return;
    const issue = editor2PublicationIssue(latest.current.fields, defaultFields);
    if (issue) {
      focusField.current = issue.focusField;
      setError(issue.errorCode); setPublicationPending(true); setPanel(issue.section);
      return;
    }
    setPublicationPending(false); setPanel(null);
    locked.current = true; setPublishing(true); setError(null);
    try {
      // Flush the whole queued draft before navigating to OAuth. Account
      // adoption moves this same invitation; nothing is stored in URL content.
      if (!await saveNow()) return;
      const access = await requestVisualPublication(id);
      if ("errorCode" in access) { setError(access.errorCode); return; }
      if ("loginUrl" in access) { router.push(access.loginUrl); return; }
      await publishCurrent();
    } catch { setError("networkError"); }
    finally { locked.current = false; setPublishing(false); }
  };
  const continuePublication = () => {
    if (locked.current) return;
    const issue = editor2PublicationIssue(latest.current.fields, defaultFields);
    if (issue) {
      focusField.current = issue.focusField;
      setError(issue.errorCode); setPanel(issue.section);
      if (panel === issue.section) {
        const input = initialDialogFocus();
        if (input !== true) input.focus();
      }
      return;
    }
    void beginPublication();
  };
  const resumedPublication = useRef(false);
  useEffect(() => {
    if (!resumePublication || resumedPublication.current) return;
    resumedPublication.current = true;
    void beginPublication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumePublication]);
  const setUploadState = (value: boolean) => { locked.current = value; setUploading(value); };
  const busy = publishing || uploading;
  const isPublished = Boolean(publishedSlug) || status === "published";
  const activeSection = isEditor2Section(renderedPanel) ? renderedPanel : null;
  const canHide = activeSection && ["album", "music", "ceremonies", "schedule", "photos", "gift"].includes(activeSection)
    && (activeSection !== "album" || draft.fields.showAlbum)
    && (activeSection !== "music" || Boolean(draft.fields.music))
    && !editor2MissingSections(draft).includes(activeSection);
  const panelTitle = activeSection ? t(`sections.${activeSection}`) : renderedPanel === "basics" ? t("startTitle") : renderedPanel === "add" ? t("add") : renderedPanel === "templates" ? t("chooseTemplate") : t("content");

  return <main className="e2-shell">
    <header className="e2-header">
      <div className="e2-heading"><Link href={TEMPLATE_LIST_PATH} className="e2-back" onClick={async event => {
        event.preventDefault(); if (!busy && await saveNow()) router.push(TEMPLATE_LIST_PATH);
      }}><ArrowLeft size={17} /><span className="e2-tool-label">{t("templates")}</span></Link>
        <div><h1>{labels[draft.fields.templateId] ?? draft.fields.templateId}</h1>
          <p className="e2-meta">{publishedSlug || status === "published" ? t("existingPublished") : t("draft")}</p></div>
      </div>
      <div className="e2-header-tools">
        <button type="button" className="e2-button e2-change-template" disabled={busy} onClick={() => open("templates")}><LayoutTemplate size={16} />{t("chooseTemplate")}</button>
        <div className="e2-actions e2-publish-actions">
          <span className="e2-save-state" role="status" aria-live="polite">{t(saveState)}</span>
          {publishedSlug ? <button type="button" className="e2-button" onClick={() => setPublishSuccessOpen(true)}>{t("sharePublished")}</button> : null}
          {isPublished
          ? <button type="button" className="e2-button e2-primary" disabled={busy || saveState === "saving"} onClick={() => void saveNow()}><Save size={16} />{t("save")}</button>
          : <button type="button" className="e2-button e2-primary" disabled={busy} onClick={() => void beginPublication()}>{t(publishing ? "publishing" : "publish")}</button>}
        </div>
      </div>
    </header>
    <nav className="e2-tools" aria-label={t("content")}>
      <div className="e2-tools-group">
        <button type="button" className="e2-button" disabled={busy} onClick={() => open("content")}><List size={17} />{t("content")}</button>
        <button type="button" className="e2-button" disabled={busy} onClick={() => open("add")}><Plus size={17} />{t("add")}</button>
      </div>
      <div className="e2-tools-group">
        <button type="button" className="e2-button e2-icon-button" aria-label={t("undo")} disabled={busy || !history.past.length} onClick={() => { dispatch({ type: "undo" }); setSaveState("unsaved"); }}><Undo2 size={17} /></button>
        <button type="button" className="e2-button e2-icon-button" aria-label={t("redo")} disabled={busy || !history.future.length} onClick={() => { dispatch({ type: "redo" }); setSaveState("unsaved"); }}><Redo2 size={17} /></button>
        {!compactScreen && <button type="button" className="e2-button" aria-label={t(phone ? "desktop" : "phone")} aria-pressed={phone} onClick={() => setPhone(value => !value)}>{phone ? <Monitor size={17} /> : <Smartphone size={17} />}<span className="e2-tool-label">{t(phone ? "desktop" : "phone")}</span></button>}
        <button type="button" className="e2-button" disabled={busy} aria-label={t(editing ? "preview" : "edit")} aria-pressed={!editing} onClick={() => setEditing(value => !value)}>{editing ? <Eye size={17} /> : <Pencil size={17} />}<span className="e2-tool-label">{t(editing ? "preview" : "edit")}</span></button>
      </div>
    </nav>
    {hint && editing && <aside className="e2-hint"><span>{t("hint")}</span><button type="button" className="e2-button e2-icon-button" aria-label={t("hideHint")} onClick={() => setHint(false)}><X size={15} /></button></aside>}
    {error && !panel && <p className="e2-error e2-alert" role="alert">{error === "networkError" ? t(error) : errorT(error)}</p>}
    <section className="e2-workspace" aria-label={t("canvasTitle")}>
      <div className={`e2-canvas-track${phone && !compactScreen ? " e2-canvas-phone" : ""}`}>
        <InlineInvitationPreview draft={previewDraft} editing={editing} base={base}
          cover3dEnabled={cover3dEnabled} hideBranding={hideBranding} samples={samples[previewDraft.fields.templateId]} onSelect={selectSection} />
      </div>
      {!isAccount && <div className="e2-bottom">{t("guestDraftNotice")}</div>}
    </section>
    <Dialog.Root open={panel !== null} disablePointerDismissal={busy} onOpenChange={(value, details) => {
      if (value) return;
      // Cancel dismissal in the dialog itself; the synchronous lock also covers
      // requests arriving before the uploading state has rendered.
      if (busy || locked.current) { details.cancel(); return; }
      setPublicationPending(false);
      if (publicationPending) setError(null);
      setPanel(null);
    }}>
      <Dialog.Portal><Dialog.Backdrop className="e2-dialog-backdrop" /><Dialog.Viewport className="e2-dialog-viewport">
        <Dialog.Popup initialFocus={initialDialogFocus} className={`e2-dialog${activeSection === "couple" || activeSection === "family" || activeSection === "gift" || (activeSection === "photos" && heroImageCount(draft.fields.templateId) === 2) || renderedPanel === "basics" || renderedPanel === "templates" ? " e2-dialog-couple" : ""}${activeSection === "schedule" ? " e2-dialog-schedule" : ""}`}>
          <header className="e2-dialog-head"><div><Dialog.Title className="e2-dialog-title">{panelTitle}</Dialog.Title>
            {publicationPending && <Dialog.Description className="e2-description">{t("completeToPublish")}</Dialog.Description>}
            </div>
            <Dialog.Close className="e2-button e2-icon-button" aria-label={t("close")} disabled={busy}><X size={18} /></Dialog.Close>
          </header>
          <div className="e2-dialog-body" ref={dialogBody}>
            {renderedPanel === "basics" && <form className="e2-dialog-fields" onSubmit={event => { event.preventDefault(); setPanel(null); }}>
              <div className="e2-couple-grid">
                {(["brideFullName", "groomFullName"] as const).map(name => <label key={name} className="e2-field"><span>{t(`fields.${name}`)}</span>
                  <input name={name} value={draft.fields[name]} required maxLength={120} onChange={event => change(previous => ({ ...previous, fields: withEditor2FullName(previous.fields, name, event.target.value) }))} />
                </label>)}
              </div>
              <Editor2DateField name="date" label={t("fields.date")} value={draft.fields.date} required onChange={date => {
                  change(previous => ({ ...previous, fields: { ...previous.fields, date }, ceremonies: /^\d{4}-\d{2}-\d{2}$/.test(date) ? previous.ceremonies.map(item => item.date ? item : { ...item, date }) : previous.ceremonies }));
                }} />
              <button className="e2-button e2-primary">{t("beginEditing")}</button>
            </form>}
            {activeSection && <fieldset key={activeSection} disabled={busy}><Editor2SectionFields invitationId={id} section={activeSection} draft={draft} onChange={change} labels={labels} samples={samples[draft.fields.templateId]} onUploading={setUploadState} /></fieldset>}
            {renderedPanel === "templates" && <div className="e2-template-picker">
              {completedTemplates.map(template => <button key={template.slug} type="button" className="e2-template-option" aria-pressed={draft.fields.templateId === template.slug} onClick={() => {
                change(previous => ({ ...previous, fields: { ...previous.fields, templateId: template.slug } }));
                setPanel(null);
              }}>
                <span className="e2-template-option-media"><Image src={templatePreviewUrl(template.listing)} alt="" fill sizes="(max-width: 640px) 40vw, 180px" className="object-cover object-top" /></span>
                <span className="e2-template-option-name">{labels[template.slug] ?? template.name}</span>
              </button>)}
            </div>}
            {(renderedPanel === "content" || renderedPanel === "add") && <div className="e2-section-list">
              {(renderedPanel === "content" ? EDITOR2_SECTIONS : ["ceremonies", ...editor2MissingSections(draft).filter(section => section !== "ceremonies" && section !== "gift")] as Editor2Section[])
                .filter(section => section !== "photos" || templateSupportsHeroImage(draft.fields.templateId)).map(section => <button key={section} type="button" className="e2-section-link" onClick={() => open(section)}>
                {renderedPanel === "add" ? t("addSection", { section: t(`sections.${section}`) }) : t(`sections.${section}`)}<ChevronRight size={17} />
              </button>)}
            </div>}
            {error && <p className="e2-error mt-4" role="alert">{error === "networkError" ? t(error) : errorT(error)}</p>}
          </div>
          <footer className="e2-dialog-footer">
            {uploading ? <span className="e2-save-state" role="status" aria-live="polite">{t("uploading")}</span>
              : canHide ? <button type="button" className="e2-button e2-danger" onClick={hideSection} disabled={busy}>{t("hideSection")}</button> : <span className="e2-save-state" role="status">{t(saveState)}</span>}
            {publicationPending
              ? <button type="button" className="e2-button e2-primary" disabled={busy} onClick={continuePublication}>{t("continuePublication")}</button>
              : <Dialog.Close className="e2-button" disabled={busy}>{t("done")}</Dialog.Close>}
          </footer>
        </Dialog.Popup>
      </Dialog.Viewport></Dialog.Portal>
    </Dialog.Root>
    {publishSuccessOpen && publishedSlug ? <PublishSuccessDialog invitationId={id} activated={hideBranding} slug={publishedSlug} onClose={() => setPublishSuccessOpen(false)} /> : null}
  </main>;
}
