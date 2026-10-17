import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { jsx } from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import messages from "../../messages/vi.json";
import { chungdoiDemoContent, type ChungDoiDemoContent } from "@/data/chungdoi-demo-content";
import { BohoFloralGreenInvitation } from "./chungdoi-tpl-boho-floral-green";

function render(content: ChungDoiDemoContent) {
  const router: AppRouterInstance = {
    bfcacheId: "ceremony-test",
    back() {}, forward() {}, refresh() {},
    push() {}, replace() {}, prefetch() {},
  };
  return renderToStaticMarkup(createElement(
    AppRouterContext.Provider,
    { value: router },
    jsx(NextIntlClientProvider, {
      locale: "vi", messages, timeZone: "Asia/Ho_Chi_Minh",
      children: createElement(BohoFloralGreenInvitation, { content }),
    }),
  ));
}

test("Hoa Mộc Xanh renders both ceremonies before the album using each ceremony's date and time", () => {
  const html = render({
    ...chungdoiDemoContent["boho-floral-green"],
    ceremonies: [
      { title: "LỄ VU QUY TẠI NHÀ GÁI", date: "2026-11-07", time: "07:00" },
      { title: "LỄ TÂN HÔN TẠI NHÀ TRAI", date: "2026-11-08", time: "09:15" },
    ],
  });
  const first = html.indexOf("LỄ VU QUY TẠI NHÀ GÁI");
  const second = html.indexOf("LỄ TÂN HÔN TẠI NHÀ TRAI");
  const album = html.indexOf("Album Ảnh Cưới");
  assert.ok(first >= 0, "first ceremony is rendered");
  assert.ok(second > first && second < album, "additional ceremony stays after the first and before the album");
  assert.match(html.slice(first, second), /07:00/);
  assert.match(html.slice(first, second), /Thứ Bảy/);
  assert.match(html.slice(second, album), /09:15/);
  assert.match(html.slice(second, album), /Chủ Nhật/);
  assert.equal((html.match(/data-template-ceremony-item/g) ?? []).length, 2);
});

test("Hoa Mộc Xanh preserves legacy single ceremonies and hides an explicitly empty ceremony list", () => {
  const content = chungdoiDemoContent["boho-floral-green"];
  const legacy = render({
    ...content,
    ceremonies: undefined,
    couple: { ...content.couple, ceremonyHeader: "LỄ CŨ", ceremonyDate: "2026-11-07", ceremonyTime: "08:30" },
  });
  assert.match(legacy, /LỄ CŨ/);
  assert.match(legacy, /08:30/);
  const empty = render({ ...content, ceremonies: [] });
  assert.doesNotMatch(empty, /data-template-ceremony-item/);
});
