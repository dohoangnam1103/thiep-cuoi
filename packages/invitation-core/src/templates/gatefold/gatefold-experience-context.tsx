"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

export type GatefoldExperienceState =
  | "closed"
  | "opening"
  | "handoff"
  | "opened";

export type GatefoldExperienceMode =
  | "public"
  | "demo"
  | "editor-preview"
  | "capture";

export type GatefoldExperienceContextValue = {
  state: GatefoldExperienceState;
  mode: GatefoldExperienceMode;
  reducedMotion: boolean;
  requestOpen: () => void;
  beginHandoff: () => void;
  registerFocusTarget: (target: HTMLElement | null) => void;
};

type GatefoldExperienceProviderProps = GatefoldExperienceContextValue & {
  children: ReactNode;
};

const GatefoldExperienceContext =
  createContext<GatefoldExperienceContextValue | null>(null);

export function GatefoldExperienceProvider({
  children,
  state,
  mode,
  reducedMotion,
  requestOpen,
  beginHandoff,
  registerFocusTarget,
}: GatefoldExperienceProviderProps) {
  const value = useMemo<GatefoldExperienceContextValue>(
    () => ({
      state,
      mode,
      reducedMotion,
      requestOpen,
      beginHandoff,
      registerFocusTarget,
    }),
    [
      state,
      mode,
      reducedMotion,
      requestOpen,
      beginHandoff,
      registerFocusTarget,
    ],
  );

  return (
    <GatefoldExperienceContext.Provider value={value}>
      {children}
    </GatefoldExperienceContext.Provider>
  );
}

export function useGatefoldExperience(): GatefoldExperienceContextValue {
  const value = useContext(GatefoldExperienceContext);

  if (!value) {
    throw new Error(
      "useGatefoldExperience must be used inside GatefoldExperienceProvider",
    );
  }

  return value;
}
