"use client";

import { CheckCircle2, KeyRound, Loader2, PlugZap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  updateAiConnectionAction,
  type AiConnectionState,
} from "@/app/admin/template-studio/actions";
import { Button } from "@/components/ui/button";
import type { AiConnectionStatus } from "@/lib/ai-config";
import { cn } from "@/lib/utils";

export function AiConnectionForm({ connection }: { connection: AiConnectionStatus }) {
  const t = useTranslations("templateStudio");
  const [state, formAction, pending] = useActionState<AiConnectionState, FormData>(
    updateAiConnectionAction,
    undefined,
  );
  const [removeApiKey, setRemoveApiKey] = useState(false);
  const apiKeyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state?.ok || !apiKeyRef.current) return;
    apiKeyRef.current.value = "";
  }, [state?.ok]);

  const errorMessage = state?.error ? t(`connection.errors.${state.error}`) : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <PlugZap className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl text-foreground">{t("connection.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{t("connection.description")}</p>
          </div>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", connection.configured ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700")}>
          {connection.configured ? t("connection.connected") : t("connection.notConnected")}
        </span>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            {t("connection.baseUrl")}
            <input
              name="baseUrl"
              type="url"
              required
              maxLength={500}
              defaultValue={connection.baseUrl}
              placeholder="https://api.openai.com/v1"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">{t("connection.baseUrlHelp")}</span>
          </label>

          <label className="text-sm font-medium text-foreground">
            {t("connection.model")}
            <input
              name="model"
              required
              maxLength={120}
              defaultValue={connection.model}
              placeholder="gpt-4o-mini"
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2.5 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">{t("connection.modelHelp")}</span>
          </label>
        </div>

        <label className="block text-sm font-medium text-foreground">
          {t("connection.apiKey")}
          <div className="relative mt-1.5">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={apiKeyRef}
              name="apiKey"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={2_000}
              disabled={removeApiKey}
              placeholder={connection.configured ? t("connection.apiKeyKeep") : t("connection.apiKeyPlaceholder")}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-3 font-mono text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:bg-muted"
            />
          </div>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {t("connection.keyStatus", { source: t(`connection.sources.${connection.keySource}`) })}
          </span>
        </label>

        {connection.hasStoredApiKey ? (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              name="removeApiKey"
              type="checkbox"
              checked={removeApiKey}
              onChange={(event) => setRemoveApiKey(event.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            {t("connection.removeStoredKey")}
          </label>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <PlugZap />}
            {pending ? t("connection.saving") : t("connection.save")}
          </Button>
          <p className="text-xs text-muted-foreground">{t("connection.securityNote")}</p>
        </div>

        {errorMessage ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{errorMessage}</p>
        ) : null}
        {state?.ok ? (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> {t("connection.saved")}
          </p>
        ) : null}
      </form>
    </section>
  );
}