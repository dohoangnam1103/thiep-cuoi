import { LegalLayout } from "../../../components/marketing/legal-layout";
import vi from "@messages/vi.json";

export default function Site2Terms() {
  const page = vi.legal.terms;
  return (
    <LegalLayout title={page.title} intro={page.intro} sections={page.sections} />
  );
}
