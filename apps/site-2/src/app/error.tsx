"use client";

"use client";

import { PageState } from "../components/states/page-state";
import { S2Button } from "../components/ui/button";
import vi from "@messages/vi.json";

/* Route error boundary with exactly one recovery action: retry the segment. */
export default function Site2Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  void error;
  return (
    <div className="s2-marketing">
      <main>
        <PageState
          kind="error"
          title={vi.states.errorTitle}
          description={vi.states.errorBody}
          action={
            <S2Button type="button" onClick={reset}>
              {vi.states.retry}
            </S2Button>
          }
        />
      </main>
    </div>
  );
}
