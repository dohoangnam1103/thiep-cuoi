import { HelpSearch } from "../../../components/marketing/help-search";
import { helpArticles } from "../../../lib/help";
import vi from "@messages/vi.json";

export default function Site2Help() {
  return (
    <div className="s2-marketing-container max-w-4xl pb-20 pt-10 md:pt-14">
      <h1 className="s2-display max-w-[18ch] text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--s2-ink)] md:text-6xl">
        {vi.help.title}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
        {vi.help.subtitle}
      </p>
      <div className="mt-8">
        <HelpSearch articles={helpArticles} />
      </div>
    </div>
  );
}
