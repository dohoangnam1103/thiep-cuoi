"use client";

import { Check, ChevronDown, CircleHelp, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { RsvpQuestionRow } from "@/lib/guest-manager";
import {
  deleteRsvpQuestion,
  saveRsvpQuestion,
  type QuestionActionResult,
} from "./rsvp-question-actions";

type QuestionType = RsvpQuestionRow["type"];

const FIELD_CLASS =
  "min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";

export function RsvpQuestionBuilder({
  invitationId,
  questions,
}: {
  invitationId: string;
  questions: RsvpQuestionRow[];
}) {
  const t = useTranslations("guestManager.questions");
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<RsvpQuestionRow | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<QuestionType>("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  const [result, setResult] = useState<QuestionActionResult>();
  const [pending, startTransition] = useTransition();

  function resetForm() {
    setEditing(null);
    setLabel("");
    setType("text");
    setRequired(false);
    setOptions("");
    setResult(undefined);
  }

  function editQuestion(question: RsvpQuestionRow) {
    setExpanded(true);
    setEditing(question);
    setLabel(question.label);
    setType(question.type);
    setRequired(question.required);
    setOptions(question.options.join("\n"));
    setResult(undefined);
  }

  function save() {
    const normalizedOptions = options
      .split(/\r?\n|,/)
      .map((option) => option.trim())
      .filter(Boolean);
    startTransition(async () => {
      const response = await saveRsvpQuestion(invitationId, editing?.id ?? null, {
        label,
        type,
        required,
        options: normalizedOptions,
      });
      setResult(response);
      if (response.ok) {
        resetForm();
        router.refresh();
      }
    });
  }

  function remove(questionId: string) {
    startTransition(async () => {
      const response = await deleteRsvpQuestion(invitationId, questionId);
      setResult(response);
      if (response.ok) {
        if (editing?.id === questionId) resetForm();
        router.refresh();
      }
    });
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <CircleHelp className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-lg font-semibold text-foreground">{t("title")}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">{t("description")}</span>
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
          {t("count", { count: questions.length })}
        </span>
        <ChevronDown className={`size-5 text-muted-foreground transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {expanded ? (
        <div className="border-t border-border p-5">
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((question) => (
                <div key={question.id} className="flex items-start gap-3 rounded-xl bg-muted/60 p-3.5">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-background text-xs font-bold text-primary">
                    {question.sortOrder + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{question.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t(`types.${question.type}`)}{question.required ? ` - ${t("required")}` : ""}
                    </p>
                    {question.options.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{question.options.join(", ")}</p>
                    ) : null}
                  </div>
                  <Button type="button" variant="ghost" size="icon" aria-label={t("edit")} onClick={() => editQuestion(question)}>
                    <Pencil aria-hidden />
                  </Button>
                  <Button type="button" variant="destructive" size="icon" aria-label={t("delete")} disabled={pending} onClick={() => remove(question.id)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-muted/60 px-4 py-5 text-center text-sm text-muted-foreground">{t("empty")}</p>
          )}

          <div className="mt-5 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">{editing ? t("editTitle") : t("addTitle")}</h3>
              {editing ? (
                <Button type="button" variant="ghost" onClick={resetForm}><X aria-hidden />{t("cancelEdit")}</Button>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
                {t("label")}
                <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={180} className={FIELD_CLASS} />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">
                {t("type")}
                <select value={type} onChange={(event) => setType(event.target.value as QuestionType)} className={FIELD_CLASS}>
                  <option value="text">{t("types.text")}</option>
                  <option value="boolean">{t("types.boolean")}</option>
                  <option value="select">{t("types.select")}</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-border bg-background px-3.5 text-sm font-medium text-foreground">
                <input type="checkbox" checked={required} onChange={(event) => setRequired(event.target.checked)} className="size-4 accent-primary" />
                {t("required")}
              </label>
              {type === "select" ? (
                <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
                  {t("options")}
                  <textarea value={options} onChange={(event) => setOptions(event.target.value)} rows={4} className={FIELD_CLASS} />
                  <span className="text-xs font-normal text-muted-foreground">{t("optionsHint")}</span>
                </label>
              ) : null}
            </div>
            {result?.error ? (
              <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(`errors.${result.error}`)}</p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button type="button" size="lg" disabled={pending || !label.trim()} onClick={save}>
                {pending ? <Loader2 className="animate-spin" aria-hidden /> : editing ? <Check aria-hidden /> : <Plus aria-hidden />}
                {pending ? t("saving") : editing ? t("save") : t("add")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
