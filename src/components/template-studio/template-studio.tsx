"use client";

import {
  ArrowDown,
  ArrowUp,
  Bot,
  Download,
  Loader2,
  Monitor,
  Redo2,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type FormEvent, startTransition, useEffect, useMemo, useState } from "react";

import { generateStudioDesign } from "@/app/admin/template-studio/actions";
import { AiConnectionForm } from "@/components/template-studio/ai-connection-form";
import { TemplateStudioPreview } from "@/components/template-studio/template-studio-preview";
import { Button } from "@/components/ui/button";
import type { AiConnectionStatus } from "@/lib/ai-config";
import {
  createInitialStudioSpec,
  studioDecorations,
  studioHeroStyles,
  studioLayouts,
  studioPalettes,
  studioSpecSchema,
  studioTypography,
  type StudioSource,
  type StudioSpec,
} from "@/lib/template-studio";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "chungdoi-template-studio-v1";
const HISTORY_LIMIT = 40;

type ChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type TemplateStudioProps = {
  sources: StudioSource[];
  initialSpec: StudioSpec;
  aiConnection: AiConnectionStatus;
};

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      >
        {children}
      </select>
    </label>
  );
}

export function TemplateStudio({ sources, initialSpec, aiConnection }: TemplateStudioProps) {
  const t = useTranslations("templateStudio");
  const [history, setHistory] = useState<StudioSpec[]>([initialSpec]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [viewport, setViewport] = useState<"mobile" | "desktop">("mobile");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 0, role: "assistant", text: t("assistantWelcome") },
  ]);

  const spec = history[historyIndex] ?? initialSpec;
  const source = useMemo(
    () => sources.find((item) => item.slug === spec.sourceSlug) ?? sources[0],
    [sources, spec.sourceSlug],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = studioSpecSchema.safeParse(JSON.parse(stored));
      if (!parsed.success || !sources.some((item) => item.slug === parsed.data.sourceSlug)) return;
      setHistory([parsed.data]);
      setHistoryIndex(0);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [sources]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
  }, [spec]);

  function commit(next: StudioSpec) {
    const parsed = studioSpecSchema.safeParse(next);
    if (!parsed.success) return;
    const base = history.slice(0, historyIndex + 1);
    const updated = [...base, parsed.data].slice(-HISTORY_LIMIT);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
  }

  function addMessage(role: ChatMessage["role"], text: string) {
    setMessages((current) => [...current, { id: Date.now() + current.length, role, text }]);
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = prompt.trim();
    if (value.length < 3 || pending) return;

    addMessage("user", value);
    setPrompt("");
    setPending(true);
    startTransition(async () => {
      try {
        const result = await generateStudioDesign({ prompt: value, current: spec });
        if (!result.ok) {
          addMessage("assistant", t(result.error === "rateLimited" ? "errorRateLimited" : "errorInvalid"));
          return;
        }
        commit(result.spec);
        addMessage("assistant", t(result.mode === "ai" ? "assistantAiApplied" : "assistantLocalApplied"));
      } catch {
        addMessage("assistant", t("errorGeneric"));
      } finally {
        setPending(false);
      }
    });
  }

  function reset() {
    const next = createInitialStudioSpec(initialSpec.sourceSlug, initialSpec.copy);
    setHistory([next]);
    setHistoryIndex(0);
    window.localStorage.removeItem(STORAGE_KEY);
    addMessage("assistant", t("assistantReset"));
  }

  function exportSpec() {
    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `template-concept-${spec.sourceSlug}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= spec.sectionOrder.length) return;
    const next = [...spec.sectionOrder];
    [next[index], next[target]] = [next[target], next[index]];
    commit({ ...spec, sectionOrder: next });
  }

  function updateCopy(key: keyof StudioSpec["copy"], value: string) {
    commit({ ...spec, copy: { ...spec.copy, [key]: value } });
  }

  if (!source) return null;

  const quickPrompts = [t("quickMinimal"), t("quickTraditional"), t("quickEditorial")];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h1 className="font-heading text-2xl text-foreground">{t("title")}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", aiConnection.configured ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700")}>
          {aiConnection.configured ? t("aiReady") : t("localMode")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <Button type="button" variant="outline" onClick={() => setHistoryIndex((value) => Math.max(0, value - 1))} disabled={historyIndex === 0}>
          <Undo2 /> {t("undo")}
        </Button>
        <Button type="button" variant="outline" onClick={() => setHistoryIndex((value) => Math.min(history.length - 1, value + 1))} disabled={historyIndex >= history.length - 1}>
          <Redo2 /> {t("redo")}
        </Button>
        <Button type="button" variant="outline" onClick={reset}><RotateCcw /> {t("reset")}</Button>
        <Button type="button" variant="outline" onClick={exportSpec}><Download /> {t("export")}</Button>
        <span className="ml-auto text-xs text-muted-foreground">{t("autosaved")} · {t("revision", { count: historyIndex + 1 })}</span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2 font-semibold"><Bot className="size-4 text-primary" /> {t("chatTitle")}</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("chatHelp")}</p>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={cn("rounded-2xl px-3 py-2 text-sm leading-6", message.role === "user" ? "ml-5 bg-primary text-primary-foreground" : "mr-5 bg-muted text-foreground")}>
                {message.text}
              </div>
            ))}
            {pending ? (
              <div className="mr-5 flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {t("thinking")}
              </div>
            ) : null}
          </div>
          <form onSubmit={submitPrompt} className="border-t border-border p-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={1_000}
              rows={4}
              placeholder={t("promptPlaceholder")}
              className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <Button type="submit" className="mt-2 w-full" disabled={pending || prompt.trim().length < 3}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />} {t("send")}
            </Button>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickPrompts.map((item) => (
                <button key={item} type="button" onClick={() => setPrompt(item)} className="rounded-full border border-border px-2 py-1 text-left text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">
                  {item}
                </button>
              ))}
            </div>
          </form>
        </aside>

        <section className="min-w-0 rounded-2xl border border-border bg-muted/40 p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{t("preview")}</h2>
            <div className="flex rounded-lg border border-border bg-background p-1">
              <button type="button" onClick={() => setViewport("mobile")} className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs", viewport === "mobile" && "bg-primary text-primary-foreground")}>
                <Smartphone className="size-3.5" /> {t("mobile")}
              </button>
              <button type="button" onClick={() => setViewport("desktop")} className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs", viewport === "desktop" && "bg-primary text-primary-foreground")}>
                <Monitor className="size-3.5" /> {t("desktop")}
              </button>
            </div>
          </div>
          <div className="max-h-[76vh] overflow-auto rounded-xl bg-black/5 p-2 sm:p-4">
            <TemplateStudioPreview spec={spec} source={source} viewport={viewport} />
          </div>
        </section>

        <aside className="space-y-5 rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <div>
            <h2 className="text-sm font-semibold">{t("settings")}</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("settingsHelp")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SelectField label={t("source")} value={spec.sourceSlug} onChange={(sourceSlug) => commit({ ...spec, sourceSlug })}>
              {sources.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </SelectField>
            <SelectField label={t("palette")} value={spec.palette} onChange={(palette) => commit({ ...spec, palette: palette as StudioSpec["palette"] })}>
              {studioPalettes.map((item) => <option key={item} value={item}>{t(`paletteNames.${item}`)}</option>)}
            </SelectField>
            <SelectField label={t("typography")} value={spec.typography} onChange={(typography) => commit({ ...spec, typography: typography as StudioSpec["typography"] })}>
              {studioTypography.map((item) => <option key={item} value={item}>{t(`typographyNames.${item}`)}</option>)}
            </SelectField>
            <SelectField label={t("layout")} value={spec.layout} onChange={(layout) => commit({ ...spec, layout: layout as StudioSpec["layout"] })}>
              {studioLayouts.map((item) => <option key={item} value={item}>{t(`layoutNames.${item}`)}</option>)}
            </SelectField>
            <SelectField label={t("decoration")} value={spec.decoration} onChange={(decoration) => commit({ ...spec, decoration: decoration as StudioSpec["decoration"] })}>
              {studioDecorations.map((item) => <option key={item} value={item}>{t(`decorationNames.${item}`)}</option>)}
            </SelectField>
            <SelectField label={t("heroStyle")} value={spec.heroStyle} onChange={(heroStyle) => commit({ ...spec, heroStyle: heroStyle as StudioSpec["heroStyle"] })}>
              {studioHeroStyles.map((item) => <option key={item} value={item}>{t(`heroStyleNames.${item}`)}</option>)}
            </SelectField>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("sectionOrder")}</h3>
            <div className="mt-2 space-y-1.5">
              {spec.sectionOrder.map((section, index) => (
                <div key={section} className="flex items-center gap-2 rounded-lg bg-muted/60 px-2 py-1.5 text-xs">
                  <span className="min-w-0 flex-1 truncate">{t(`sectionNames.${section}`)}</span>
                  <button type="button" aria-label={t("moveUp")} onClick={() => moveSection(index, -1)} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-25"><ArrowUp className="size-3.5" /></button>
                  <button type="button" aria-label={t("moveDown")} onClick={() => moveSection(index, 1)} disabled={index === spec.sectionOrder.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-25"><ArrowDown className="size-3.5" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("copy")}</h3>
            {(["eyebrow", "quote", "closing"] as const).map((key) => (
              <label key={key} className="block text-xs font-semibold text-muted-foreground">
                {t(`copyNames.${key}`)}
                <textarea
                  key={`${key}-${spec[key === "eyebrow" ? "sourceSlug" : "palette"]}-${historyIndex}`}
                  defaultValue={spec.copy[key]}
                  maxLength={key === "eyebrow" ? 80 : 240}
                  rows={key === "eyebrow" ? 2 : 3}
                  onBlur={(event) => updateCopy(key, event.target.value)}
                  className="mt-1.5 w-full resize-none rounded-lg border border-input bg-background p-2 text-sm font-normal text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </label>
            ))}
          </div>
        </aside>
      </div>

      <AiConnectionForm connection={aiConnection} />
    </div>
  );
}