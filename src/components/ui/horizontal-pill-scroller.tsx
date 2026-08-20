"use client";

import { ScrollArea } from "@base-ui/react/scroll-area";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type HorizontalPillScrollerProps = Omit<
  ComponentPropsWithoutRef<typeof ScrollArea.Viewport>,
  "children"
> & {
  children: ReactNode;
  contentClassName?: string;
};

/**
 * A touch-first row of pills that hides the browser scrollbar. Above the
 * mobile breakpoint, it becomes a regular wrapping row.
 */
export function HorizontalPillScroller({
  children,
  className,
  contentClassName,
  ...props
}: HorizontalPillScrollerProps) {
  return (
    <ScrollArea.Root className="min-w-0">
      <ScrollArea.Viewport
        {...props}
        className={cn(
          "min-w-0 !overflow-x-auto !overflow-y-hidden overscroll-x-contain snap-x snap-proximity sm:!overflow-visible",
          className,
        )}
      >
        <ScrollArea.Content
          data-slot="horizontal-pill-scroller-content"
          className={cn(
            "flex flex-nowrap gap-2 px-5 sm:!min-w-0 sm:w-full sm:flex-wrap sm:px-0",
            contentClassName,
          )}
        >
          {children}
        </ScrollArea.Content>
      </ScrollArea.Viewport>
    </ScrollArea.Root>
  );
}
