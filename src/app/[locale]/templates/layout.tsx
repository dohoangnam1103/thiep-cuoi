// The demo route (/templates/[slug]/demo) must stay public so guests can open
// it by scanning the preview QR on a phone that isn't logged in. Auth is
// enforced per-page (see page.tsx for the gated listing) rather than here,
// where a layout would gate every descendant including the demo. Likewise no
// `robots: noindex` lives here — it would cascade to the demo pages, which are
// built to be indexed (full OG/Twitter/hreflang metadata). The gated listing
// sets its own noindex instead.
export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
