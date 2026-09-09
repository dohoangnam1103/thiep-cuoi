// Detail pages and interactive demos are public. Each leaf owns its metadata:
// pilot details are indexable; demos and capture pages set their own noindex.
export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
