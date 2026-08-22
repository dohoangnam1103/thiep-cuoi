"use client";

import { Clipboard, Link2, Loader2, RefreshCw, ShieldCheck, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { bodyClass, panelSubTitleClass } from "@/lib/typography";
import { revokeCohostLink, rotateCohostLink, type CohostActionResult } from "./cohost-actions";

export function CohostAccess({
  invitationId,
  initialToken,
  published,
}: {
  invitationId: string;
  initialToken: string | null;
  published: boolean;
}) {
  const t = useTranslations("guestManager.cohost");
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<CohostActionResult>();
  const [pending, startTransition] = useTransition();
  const path = token ? `/khach-moi/${token}` : "";

  function rotate() {
    startTransition(async () => {
      const response = await rotateCohostLink(invitationId);
      setResult(response);
      if (response.ok) {
        setToken(response.token ?? null);
        setCopied(false);
      }
    });
  }

  function revoke() {
    startTransition(async () => {
      const response = await revokeCohostLink(invitationId);
      setResult(response);
      if (response.ok) {
        setToken(null);
        setCopied(false);
      }
    });
  }

  async function copy() {
    if (!path) return;
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true);
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={`${panelSubTitleClass} text-foreground`}>{t("title")}</h2>
          <p className={`mt-1 ${bodyClass} text-muted-foreground`}>{t("description")}</p>
        </div>
      </div>

      {!published ? (
        <p className={`mt-4 rounded-xl bg-amber-500/10 px-4 py-3 ${bodyClass} text-amber-700`}>{t("unpublished")}</p>
      ) : token ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
            <Link2 className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className={`min-w-0 flex-1 truncate ${bodyClass} text-muted-foreground`}>{path}</p>
            <Button type="button" variant="secondary" onClick={copy}>
              <Clipboard aria-hidden />{copied ? t("copied") : t("copy")}
            </Button>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={rotate}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <RefreshCw aria-hidden />}{t("regenerate")}
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={revoke}>
              <Unlink aria-hidden />{t("revoke")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex justify-end">
          <Button type="button" size="lg" disabled={pending} onClick={rotate}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Link2 aria-hidden />}{t("create")}
          </Button>
        </div>
      )}

      {result?.error ? (
        <p role="alert" className={`mt-3 rounded-xl bg-destructive/10 px-3 py-2 ${bodyClass} text-destructive`}>{t(`errors.${result.error}`)}</p>
      ) : null}
    </section>
  );
}
