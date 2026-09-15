import { LegalLayout } from "../../../components/marketing/legal-layout";
import vi from "@messages/vi.json";

export default function Site2Refund() {
  const page = vi.legal.refund;
  return (
    <LegalLayout title={page.title} intro={page.intro} sections={page.sections} />
  );
}
