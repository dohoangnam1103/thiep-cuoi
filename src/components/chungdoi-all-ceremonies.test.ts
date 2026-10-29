import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { createElement, type ComponentType } from "react";
import { jsx } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { assertCeremonyDate, ceremonyMarkup } from "../../tests/helpers/ceremony-markup";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import messages from "../../messages/vi.json";
import { templates } from "@/data/chungdoi";
import { chungdoiDemoContent, type ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { templateRendererInventory } from "../../tests/helpers/template-renderer-inventory";

// CSS values do not affect SSR data binding; real CSS/layout is checked in the
// browser audit. Several physical invitation readers import CSS modules.
const requireForStyles = createRequire(pathToFileURL(`${process.cwd()}/package.json`));
requireForStyles.extensions[".css"] = (styleModule) => {
  styleModule.exports = { __esModule: true, default: new Proxy({}, { get: (_target, key) => String(key) }) };
};

const inventory = templateRendererInventory();
const ceremonies = [
  { title: "CEREMONY ALPHA NATIVE", date: "2031-01-11", time: "03:17" },
  { title: "CEREMONY BETA NATIVE", date: "2032-02-22", time: "05:29" },
  { title: "CEREMONY GAMMA NATIVE", date: "2033-03-30", time: "07:43" },
];
const router: AppRouterInstance = {
  bfcacheId: "all-ceremonies-test", back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch() {},
};
function render(component: ComponentType<{ content: ChungDoiDemoContent }>, content: ChungDoiDemoContent) {
  const localized = jsx(NextIntlClientProvider, {
    locale: "vi", messages, timeZone: "Asia/Ho_Chi_Minh", children: createElement(component, { content }),
  });
  const pathname = createElement(PathnameContext.Provider, { value: "/thiep/ceremony-test" }, localized);
  return renderToStaticMarkup(createElement(AppRouterContext.Provider, { value: router }, pathname));
}

test("every catalog template is covered by the ceremony regression", () => {
  for (const template of templates) {
    assert.ok(inventory.has(template.slug), `${template.slug}: missing registry/discovery coverage`);
    assert.equal(inventory.get(template.slug)!.ceremonyRendering, "inline-all", `${template.slug}: native rendering required`);
  }
  assert.equal(inventory.size, templates.length, "all registered renderers belong to the tested catalog");
});

for (const template of templates) {
  test(`${template.slug}: native renderer preserves all ceremonies and empty/legacy data`, {
    skip: template.slug === "detective-conan-casebook" ? "Paginated ceremony chapter mounts after interaction; covered by the catalog browser audit" : false,
  }, async () => {
    const entry = inventory.get(template.slug)!;
    const rendererModule = await import(pathToFileURL(entry.modulePath).href) as Record<string, ComponentType<{ content: ChungDoiDemoContent }>>;
    const component = rendererModule[entry.exportName];
    assert.equal(typeof component, "function", `${template.slug}: real renderer export`);
    const base = chungdoiDemoContent[template.slug];
    assert.ok(base, `${template.slug}: demo content exists`);
    const html = render(component, {
      ...base,
      couple: { ...base.couple, date: "2041-04-03", ceremonyHeader: "STALE LEGACY CEREMONY", ceremonyDate: "2020-04-17", ceremonyTime: "02:11" },
      ceremonies,
    });
    assert.ok(html.includes("03/04/2041"), `${template.slug}: reception uses DD/MM/YYYY`);
    for (const ceremony of ceremonies) assert.ok(html.includes(ceremony.title), `${template.slug}: missing native ${ceremony.title}`);
    const { regions, items, regionPositions, footerPositions } = ceremonyMarkup(html);
    assert.ok(footerPositions.length > 0, `${template.slug}: native footer must be identified`);
    assert.ok(footerPositions.every((position) => regionPositions[0] < position), `${template.slug}: native ceremonies precede footer`);
    assert.equal(regions.length, 1, `${template.slug}: one native ceremony region`);
    assert.equal(items.length, 3, `${template.slug}: three native ceremony items`);
    for (const [index, ceremony] of ceremonies.entries()) {
      assert.ok(items[index].includes(ceremony.title), `${template.slug}: ceremony order/title ${index}`);
      assert.ok(items[index].includes(ceremony.time), `${template.slug}: own time ${index}`);
      assert.ok(items[index].includes(ceremony.date.split("-").reverse().join("/")), `${template.slug}: ceremony ${index} uses DD/MM/YYYY`);
      assertCeremonyDate(items[index], ceremony.date, ceremony.time, false, `${template.slug} ceremony ${index}`);
      assert.ok(!items[index].includes("02:11"), `${template.slug}: no stale legacy time`);
      assert.ok(regions[0].includes(ceremony.title), `${template.slug}: all ceremonies share native region`);
    }
    assert.equal(entry.ceremonyRendering, "inline-all", `${template.slug}: shell must not append ceremonies after footer`);
    assert.equal(ceremonyMarkup(render(component, { ...base, ceremonies: [] })).items.length, 0, `${template.slug}: explicit empty list`);
    const legacy = ceremonyMarkup(render(component, {
      ...base, ceremonies: undefined,
      couple: { ...base.couple, ceremonyHeader: "LEGACY SINGLE CEREMONY", ceremonyDate: "2031-01-11", ceremonyTime: "03:17" },
    }));
    assert.equal(legacy.items.length, 1, `${template.slug}: legacy single ceremony`);
    assert.ok(legacy.items[0].includes("LEGACY SINGLE CEREMONY"));
    const absent = ceremonyMarkup(render(component, {
      ...base, ceremonies: undefined,
      couple: { ...base.couple, ceremonyHeader: " ", ceremonyDate: " ", ceremonyTime: " " },
    }));
    assert.equal(absent.items.length, 0, `${template.slug}: absent legacy ceremony stays hidden`);
    const partial = ceremonyMarkup(render(component, {
      ...base,
      ceremonies: [
        { title: "PARTIAL TITLE CEREMONY", date: "", time: "" },
        { title: "", date: "", time: "04:53" },
        { title: "", date: "2031-01-11", time: "" },
      ],
    }));
    assert.equal(partial.items.length, 3, `${template.slug}: retain title-only, time-only and date-only ceremonies`);
    assert.ok(partial.items[0].includes("PARTIAL TITLE CEREMONY"));
    assert.ok(partial.items[1].includes("04:53"));
    assert.ok(partial.items[2].includes("11"));

  });
}
