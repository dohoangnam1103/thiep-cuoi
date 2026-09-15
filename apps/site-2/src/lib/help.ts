import vi from "@messages/vi.json";

export type HelpCategory =
  | "bat-dau"
  | "chinh-thiep"
  | "khach-moi"
  | "thanh-toan";

export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  category: HelpCategory;
  steps: readonly string[];
};

const CATEGORIES: readonly HelpCategory[] = [
  "bat-dau",
  "chinh-thiep",
  "khach-moi",
  "thanh-toan",
];

function isHelpCategory(value: string): value is HelpCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

export const helpArticles: readonly HelpArticle[] = vi.help.articles.map(
  (article) => ({
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    category: isHelpCategory(article.category)
      ? article.category
      : "bat-dau",
    steps: article.steps,
  }),
);

export function helpCategoryLabel(category: HelpCategory): string {
  const labels = vi.help.categories as Record<string, string>;
  return labels[category] ?? category;
}

/* Categories that actually have articles, in catalog order. Empty categories
 * never render a filter pill. */
export function presentHelpCategories(
  articles: readonly HelpArticle[],
): HelpCategory[] {
  return CATEGORIES.filter((category) =>
    articles.some((article) => article.category === category),
  );
}

export function filterArticles(
  articles: readonly HelpArticle[],
  query: string,
  category: HelpCategory | "all",
): HelpArticle[] {
  const needle = query.trim().toLowerCase();
  return articles.filter((article) => {
    if (category !== "all" && article.category !== category) return false;
    if (!needle) return true;
    const haystack = [article.title, article.summary, ...article.steps]
      .join("\n")
      .toLowerCase();
    return haystack.includes(needle);
  });
}
