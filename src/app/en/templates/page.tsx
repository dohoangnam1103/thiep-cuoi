import type { Metadata } from "next";

import { ChungDoiListing } from "@/components/chungdoi-listing";

export const metadata: Metadata = {
  title: "Wedding Invitation Templates | ChungDoi Clone",
  description:
    "Browse the ChungDoi wedding invitation templates: filter by style and color, preview and open a live demo with cover animation, gallery and RSVP.",
  alternates: { canonical: "/en/templates" },
};

export default function EnglishTemplatesPage() {
  return <ChungDoiListing />;
}
