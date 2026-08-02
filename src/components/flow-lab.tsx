"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { MotionDemoCard } from "@/components/motion-lab/motion-demo-card";
import {
  FLOW_DEMO_CHOREOGRAPHIES,
  FLOW_DEMO_ENGINES,
  type FlowDemoChoreography,
  type FlowDemoEngine,
  type FlowDemoViewMode,
} from "@/data/flow-demo-scenes";
import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function reducedMotionSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function serverReducedMotionSnapshot(): boolean {
  return false;
}

function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    reducedMotionSnapshot,
    serverReducedMotionSnapshot,
  );
}

type ChoiceButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  testId: string;
};

function ChoiceButton({
  active,
  children,
  onClick,
  testId,
}: ChoiceButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b12]",
        active
          ? "border-[#ef6f61] bg-[#ef6f61] text-[#171016]"
          : "border-white/12 bg-white/[0.035] text-[#b7b5bf] hover:border-white/30 hover:text-[#f7f4ec]",
      )}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function FlowLab() {
  const t = useTranslations("flowDemoLab");
  const systemReducedMotion = useSystemReducedMotion();
  const [viewMode, setViewMode] = useState<FlowDemoViewMode>("focus");
  const [engine, setEngine] = useState<FlowDemoEngine>("waapi");
  const [choreography, setChoreography] =
    useState<FlowDemoChoreography>("splitGate");
  const [runId, setRunId] = useState(1);
  const [forceReducedMotion, setForceReducedMotion] = useState(false);
  const reducedMotion = forceReducedMotion || systemReducedMotion;
  const copy = {
    body: t("stage.body"),
    date: t("stage.date"),
    kicker: t("stage.kicker"),
    title: t("stage.title"),
  };

  const changeView = (nextView: FlowDemoViewMode) => {
    if (nextView === viewMode) return;
    setViewMode(nextView);
    setRunId((current) => current + 1);
  };

  const changeChoreography = (nextChoreography: FlowDemoChoreography) => {
    if (nextChoreography === choreography) return;
    setChoreography(nextChoreography);
    setRunId((current) => current + 1);
  };

  const changeEngine = (nextEngine: FlowDemoEngine) => {
    if (nextEngine === engine) return;
    setEngine(nextEngine);
    setRunId((current) => current + 1);
  };

  const toggleReducedMotion = (checked: boolean) => {
    setForceReducedMotion(checked);
    setRunId((current) => current + 1);
  };

  const cardProps = (selectedEngine: FlowDemoEngine) => ({
    choreography,
    choreographyLabel: t(`choreographies.${choreography}.label`),
    copy,
    engine: selectedEngine,
    engineDescription: t(`engines.${selectedEngine}.description`),
    engineLabel: t(`engines.${selectedEngine}.label`),
    loadingLabel: t("webglLoading"),
    reducedMotion,
    runId,
    unavailableLabel: t("webglUnavailable"),
  });

  return (
    <main className="min-h-[100dvh] overflow-x-clip bg-[#080b12] text-[#f7f4ec]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="max-w-4xl">
          <h1 className="text-balance text-[clamp(2.25rem,7vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.055em]">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-[68ch] text-sm leading-6 text-[#aaa8b2] sm:text-base sm:leading-7">
            {t("subtitle")}
          </p>
          <p className="mt-4 border-l-2 border-[#ef6f61] pl-4 text-sm font-medium leading-6 text-[#ded9d0]">
            {t("mobilePriority")}
          </p>
        </header>

        <section
          aria-label={t("controlsLabel")}
          className="mt-8 border-y border-white/10 py-6 sm:mt-10"
        >
          <div className="grid gap-6 xl:grid-cols-[auto_1fr] xl:gap-10">
            <fieldset className="min-w-0">
              <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#777987]">
                {t("viewLabel")}
              </legend>
              <div className="flex flex-wrap gap-2">
                <ChoiceButton
                  active={viewMode === "focus"}
                  onClick={() => changeView("focus")}
                  testId="flow-demo-view-focus"
                >
                  {t("viewFocus")}
                </ChoiceButton>
                <ChoiceButton
                  active={viewMode === "compare"}
                  onClick={() => changeView("compare")}
                  testId="flow-demo-view-compare"
                >
                  {t("viewCompare")}
                </ChoiceButton>
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#777987]">
                {t("choreographyLabel")}
              </legend>
              <div className="flex flex-wrap gap-2">
                {FLOW_DEMO_CHOREOGRAPHIES.map((option) => (
                  <ChoiceButton
                    key={option}
                    active={choreography === option}
                    onClick={() => changeChoreography(option)}
                    testId={`flow-demo-choreography-${option}`}
                  >
                    {t(`choreographies.${option}.label`)}
                  </ChoiceButton>
                ))}
              </div>
              <p className="mt-3 max-w-[76ch] text-sm leading-6 text-[#8f92a0]">
                {t(`choreographies.${choreography}.description`)}
              </p>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-col gap-5 border-t border-white/[0.07] pt-6 lg:flex-row lg:items-end lg:justify-between">
            {viewMode === "focus" ? (
              <fieldset className="min-w-0 flex-1">
                <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#777987]">
                  {t("engineLabel")}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {FLOW_DEMO_ENGINES.map((option) => (
                    <ChoiceButton
                      key={option}
                      active={engine === option}
                      onClick={() => changeEngine(option)}
                      testId={`flow-demo-engine-${option}`}
                    >
                      {t(`engines.${option}.label`)}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>
            ) : (
              <p className="max-w-[70ch] text-sm leading-6 text-[#8f92a0]">
                {t("compareHint")}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-full border border-white/12 bg-white/[0.035] px-4 text-sm font-semibold text-[#b7b5bf] focus-within:ring-2 focus-within:ring-[#ef6f61] focus-within:ring-offset-2 focus-within:ring-offset-[#080b12]">
                <input
                  checked={forceReducedMotion}
                  className="size-4 accent-[#ef6f61]"
                  data-testid="flow-demo-reduced-motion"
                  onChange={(event) => toggleReducedMotion(event.target.checked)}
                  type="checkbox"
                />
                {t("reducedMotion")}
              </label>
              <button
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#ef6f61] px-4 text-sm font-semibold text-[#f7f4ec] transition-colors hover:bg-[#ef6f61] hover:text-[#171016] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef6f61] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b12]"
                data-testid="flow-demo-replay"
                onClick={() => setRunId((current) => current + 1)}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
                {t("replay")}
              </button>
            </div>
          </div>
        </section>

        <section aria-label={t("previewLabel")} className="mt-6 sm:mt-8">
          {viewMode === "focus" ? (
            <MotionDemoCard {...cardProps(engine)} />
          ) : (
            <div
              className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2"
              data-testid="flow-demo-compare-grid"
            >
              {FLOW_DEMO_ENGINES.map((option) => (
                <MotionDemoCard
                  key={option}
                  {...cardProps(option)}
                  compact
                />
              ))}
            </div>
          )}
        </section>

        <aside className="mt-8 grid gap-6 border-t border-white/10 pt-7 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em]">
              {t("guardrailsTitle")}
            </h2>
            <p className="mt-2 max-w-[64ch] text-sm leading-6 text-[#8f92a0]">
              {t("guardrailsBody")}
            </p>
          </div>
          <div className="grid gap-3 text-sm leading-6 text-[#aaa8b2] sm:grid-cols-2">
            <p className="border-l border-white/15 pl-4">{t("guardrailTransform")}</p>
            <p className="border-l border-white/15 pl-4">{t("guardrailFinite")}</p>
            <p className="border-l border-white/15 pl-4">{t("guardrailDpr")}</p>
            <p className="border-l border-[#ef6f61]/70 pl-4 text-[#ded9d0]">
              {t("compareWarning")}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
