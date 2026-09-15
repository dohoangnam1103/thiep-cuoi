import { LegalLayout } from "../../../components/marketing/legal-layout";
import vi from "@messages/vi.json";

export default function Site2Privacy() {
  const page = vi.legal.privacy;
  return (
    <LegalLayout title={page.title} intro={page.intro} sections={page.sections} />
  );
}
