import fs from "node:fs/promises";

const { completedTemplates, retiredTemplateSlugs } = await import("../src/data/chungdoi.ts");
const { getVietnameseTemplateSlug } = await import("../src/data/template-route-slugs.ts");

const OUTPUT = new URL("../tmp/template-seo-details-crawled.json", import.meta.url);
const USER_AGENT = "ChungdoiSEOContentResearch/1.0 (+https://thiepmungonline.com)";
const EXPLICIT = new Set([
  "song-hy-red",
  "minimalism-red",
  "minimalism-dark-red",
  "hoa-mai-thuy-mac",
  "hong-van-rose",
]);

function decode(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function text(fragment) {
  return decode(fragment.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " "));
}

function jsonLd(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => {
      try { return [JSON.parse(match[1].trim())]; } catch { return []; }
    });
}

function section(html, heading) {
  const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  const current = headings.findIndex((item) => text(item[1]).toLowerCase().includes(heading.toLowerCase()));
  if (current < 0) return "";
  const start = headings[current].index + headings[current][0].length;
  const end = headings[current + 1]?.index ?? html.length;
  return html.slice(start, end);
}

function listItems(fragment) {
  return [...fragment.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((item) => text(item[1]))
    .filter(Boolean);
}

function paragraphs(fragment) {
  return [...fragment.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((item) => text(item[1]))
    .filter(Boolean);
}

function faqData(structured) {
  const faq = structured.find((item) => item?.["@type"] === "FAQPage");
  return Array.isArray(faq?.mainEntity)
    ? faq.mainEntity.flatMap((item) => item?.name && item?.acceptedAnswer?.text
      ? [{ question: item.name.trim(), answer: item.acceptedAnswer.text.trim() }]
      : [])
    : [];
}

function creativeWork(structured) {
  return structured.find((item) => item?.["@type"] === "CreativeWork") ?? {};
}

function parsePage(html, template) {
  const structured = jsonLd(html);
  const work = creativeWork(structured);
  const heading = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? template.name);
  const intro = paragraphs(section(html, "giới thiệu"));
  const highlights = listItems(section(html, "điểm nổi bật"));
  const features = listItems(section(html, "tính năng"));
  const suitable = [...section(html, "phù hợp cho").matchAll(/<(?:span|li)[^>]*>([\s\S]*?)<\/(?:span|li)>/gi)]
    .map((item) => text(item[1])).filter(Boolean);
  const description = typeof work.description === "string" ? work.description.trim() : template.description;
  const metaDescription = description.length > 160 ? `${description.slice(0, 157).replace(/\s+\S*$/, "")}...` : description;
  const body = intro.length > 0 ? intro : [description];
  const faq = faqData(structured).slice(0, 4);
  const usableHighlights = highlights.length >= 3 ? highlights.slice(0, 4) : template.highlights;
  const usableFeatures = features.length >= 3 ? features.slice(0, 8) : usableHighlights;
  const usableSuitable = suitable.length >= 2 ? suitable.slice(0, 4) : [template.category, template.color];

  return {
    metaTitle: heading.length <= 65 ? `${heading} | Thiệp Mừng Online` : heading,
    metaDescription,
    heading,
    intro: body.join("\n\n"),
    highlights: usableHighlights,
    suitableFor: usableSuitable,
    features: usableFeatures,
    steps: [
      `Xem bản mẫu ${template.name} để kiểm tra bố cục, màu sắc và các phần nội dung chính.`,
      `Tạo thiệp cưới online với mẫu ${template.name}, sau đó thay tên, thông tin sự kiện và ảnh cưới của bạn.`,
      "Xem trước trên điện thoại và máy tính rồi xuất bản đường dẫn để gửi đến khách mời.",
    ],
    faq: faq.length >= 2 ? faq : [
      { question: `Mẫu ${template.name} phù hợp với đám cưới nào?`, answer: body[0] },
      { question: `Mẫu ${template.name} có thể tạo thiệp online không?`, answer: "Bạn có thể dùng bản mẫu để xem bố cục, sau đó tạo một thiệp riêng và thay toàn bộ thông tin minh họa bằng nội dung thật của mình." },
    ],
    imageAlt: `${heading} – mẫu thiệp cưới online`,
    relatedSlugs: [],
    relatedBlogSlugs: [],
    source: "chungdoi",
  };
}

const targets = completedTemplates.filter((template) => !retiredTemplateSlugs.has(template.slug) && !EXPLICIT.has(template.slug));
const results = {};
const failures = [];

for (let index = 0; index < targets.length; index += 4) {
  const batch = targets.slice(index, index + 4);
  const resolved = await Promise.all(batch.map(async (template) => {
    const route = getVietnameseTemplateSlug(template.slug);
    const url = `https://chungdoi.com/vi/mau-thiep/${route}`;
    try {
      const response = await fetch(url, { headers: { "user-agent": USER_AGENT } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      return [template.slug, parsePage(html, template)];
    } catch (error) {
      failures.push({ slug: template.slug, url, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }));
  for (const item of resolved) if (item) results[item[0]] = item[1];
}

await fs.mkdir(new URL("../tmp/", import.meta.url), { recursive: true });
await fs.writeFile(OUTPUT, `${JSON.stringify({ results, failures }, null, 2)}\n`);
console.log(`crawled=${Object.keys(results).length} failures=${failures.length}`);
if (failures.length) console.log(JSON.stringify(failures, null, 2));
