import assert from "node:assert/strict";
import test from "node:test";

import {
  parseBoundedFormData,
  RequestBodyTooLargeError,
} from "@/lib/bounded-form-data";

function multipartRequest(contents: Uint8Array): Request {
  const formData = new FormData();
  const copy = Uint8Array.from(contents);
  formData.set("file", new Blob([copy.buffer], { type: "image/png" }), "photo.png");
  return new Request("http://localhost/upload", { method: "POST", body: formData });
}

test("parses a multipart request within its byte limit", async () => {
  const request = multipartRequest(new Uint8Array(128));
  const formData = await parseBoundedFormData(request, 4 * 1024);
  const file = formData.get("file");

  assert.ok(file instanceof File);
  assert.equal(file.size, 128);
});

test("rejects a chunked multipart request over its byte limit", async () => {
  const request = multipartRequest(new Uint8Array(128 * 1024));
  assert.equal(request.headers.get("content-length"), null);

  await assert.rejects(
    parseBoundedFormData(request, 4 * 1024),
    RequestBodyTooLargeError,
  );
});
