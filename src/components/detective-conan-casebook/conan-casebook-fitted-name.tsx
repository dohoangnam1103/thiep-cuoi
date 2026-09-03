"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import styles from "./conan-casebook-fitted-name.module.css";

const scaleSteps = [
  { factor: 1, className: styles.scale100 },
  { factor: 0.95, className: styles.scale95 },
  { factor: 0.9, className: styles.scale90 },
  { factor: 0.85, className: styles.scale85 },
  { factor: 0.8, className: styles.scale80 },
  { factor: 0.75, className: styles.scale75 },
  { factor: 0.7, className: styles.scale70 },
  { factor: 0.65, className: styles.scale65 },
  { factor: 0.6, className: styles.scale60 },
  { factor: 0.55, className: styles.scale55 },
  { factor: 0.5, className: styles.scale50 },
  { factor: 0.45, className: styles.scale45 },
  { factor: 0.4, className: styles.scale40 },
  { factor: 0.35, className: styles.scale35 },
  { factor: 0.3, className: styles.scale30 },
  { factor: 0.25, className: styles.scale25 },
] as const;

export function ConanCasebookFittedName({
  className,
  name,
  hero = false,
}: {
  className?: string;
  name: string;
  hero?: boolean;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scaleClass, setScaleClass] = useState(styles.scale25);

  const fit = useCallback(() => {
    const line = lineRef.current;
    const text = textRef.current;
    if (!line || !text) return;

    const availableWidth = Math.max(0, line.clientWidth - 2);
    const naturalWidth = text.scrollWidth;
    const ratio = naturalWidth > 0
      ? Math.min(1, availableWidth / naturalWidth)
      : 1;
    const next = scaleSteps.find((step) => step.factor <= ratio)
      ?? scaleSteps[scaleSteps.length - 1];
    setScaleClass((current) => (
      current === next.className ? current : next.className
    ));
  }, []);

  useLayoutEffect(() => {
    const initialFrame = window.requestAnimationFrame(fit);
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(fit);
    if (lineRef.current) observer?.observe(lineRef.current);
    if (textRef.current) observer?.observe(textRef.current);
    window.addEventListener("resize", fit);

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) fit();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(initialFrame);
      observer?.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [fit, name]);

  return (
    <span data-invitation-short-name={hero || undefined} className={styles.line} ref={lineRef}>
      <span
        className={cn(styles.text, scaleClass, className)}
        ref={textRef}
      >
        {name}
      </span>
    </span>
  );
}
