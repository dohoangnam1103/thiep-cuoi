"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";

const toasterStyle = {
  "--width": "min(32rem, calc(100vw - 2rem))",
} as CSSProperties;

const toastStyle: CSSProperties = {
  left: 0,
  right: 0,
  width: "fit-content",
  maxWidth: "100%",
  marginInline: "auto",
};

export function AdaptiveToaster() {
  return (
    <Toaster
      position="top-center"
      theme="light"
      richColors
      style={toasterStyle}
      toastOptions={{
        style: toastStyle,
        classNames: {
          content: "min-w-0",
          title: "whitespace-normal",
          description: "whitespace-normal",
        },
      }}
    />
  );
}
