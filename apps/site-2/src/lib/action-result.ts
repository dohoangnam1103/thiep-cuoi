/* Typed server-action results. UI code never parses error message strings;
 * it branches on `ok` and reads `fieldErrors` or `formError`. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      fieldErrors?: Record<string, string>;
      formError: string;
    };
