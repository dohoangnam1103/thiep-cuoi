import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PageState } from "../states/page-state";
import { S2Button } from "./button";
import { S2Field } from "./field";
import { S2Status } from "./status";

test("field always renders a visible label and described error", () => {
  const html = renderToStaticMarkup(
    <S2Field
      id="bride-name"
      name="brideName"
      label="Tên cô dâu"
      error="Vui lòng nhập tên"
    />,
  );
  assert.match(html, /<label[^>]*for="bride-name"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="bride-name-error"/);
});

test("button defaults to type button and supports disabled state", () => {
  const html = renderToStaticMarkup(<S2Button>Xem mẫu thiệp</S2Button>);
  assert.match(html, /type="button"/);
  const disabledHtml = renderToStaticMarkup(
    <S2Button disabled>Đang lưu</S2Button>,
  );
  assert.match(disabledHtml, /disabled/);
});

test("status exposes its semantic kind", () => {
  const html = renderToStaticMarkup(
    <S2Status kind="published" label="Đã xuất bản" />,
  );
  assert.match(html, /data-s2-status="published"/);
  assert.match(html, /Đã xuất bản/);
});

test("page state renders title and recovery action", () => {
  const html = renderToStaticMarkup(
    <PageState
      kind="empty"
      title="Chưa có thiệp nào"
      description="Hãy chọn một mẫu để bắt đầu."
      action={<a href="/mau-thiep">Xem mẫu thiệp</a>}
    />,
  );
  assert.match(html, /Chưa có thiệp nào/);
  assert.match(html, /href="\/mau-thiep"/);
});
