import assert from "node:assert/strict";
import test from "node:test";

import {
  hasMeaningfulBlogContent,
  sanitizeBlogHtml,
} from "@/lib/blog-content";
import { slugifyBlogTitle } from "@/lib/blog-slug";
import { normalizeBlogVideoUrl } from "@/lib/blog-video";

test("slugifyBlogTitle normalizes Vietnamese titles", () => {
  assert.equal(
    slugifyBlogTitle("  Thiệp Cưới Điện Tử: Đẹp & Tiện!  "),
    "thiep-cuoi-dien-tu-dep-tien",
  );
  assert.equal(slugifyBlogTitle("💐💍"), "bai-viet");
});

test("normalizeBlogVideoUrl accepts supported YouTube and MP4 URLs", () => {
  assert.deepEqual(
    normalizeBlogVideoUrl("https://youtu.be/dQw4w9WgXcQ?t=10"),
    {
      type: "youtube",
      videoId: "dQw4w9WgXcQ",
      src: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    },
  );
  assert.deepEqual(
    normalizeBlogVideoUrl("https://cdn.example.com/wedding/video.mp4?token=1"),
    {
      type: "mp4",
      src: "https://cdn.example.com/wedding/video.mp4?token=1",
    },
  );
  assert.equal(normalizeBlogVideoUrl("http://cdn.example.com/video.mp4"), null);
  assert.equal(normalizeBlogVideoUrl("https://example.com/embed/video"), null);
});

test("sanitizeBlogHtml keeps editor markup and removes executable HTML", () => {
  const html = sanitizeBlogHtml(`
    <h2 style="text-align: center; color: red" onclick="alert(1)">Tiêu đề</h2>
    <script>alert(1)</script>
    <p><a href="javascript:alert(1)">xấu</a></p>
    <img src="/blog-media/123e4567-e89b-12d3-a456-426614174000.webp" onerror="alert(1)">
    <iframe src="https://evil.example/embed/1"></iframe>
    <iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>
  `);

  assert.match(html, /<h2 style="text-align:center">Tiêu đề<\/h2>/);
  assert.doesNotMatch(html, /script|onclick|onerror|javascript|evil\.example|color:/);
  assert.match(html, /src="\/blog-media\/123e4567-e89b-12d3-a456-426614174000\.webp"/);
  assert.match(html, /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  assert.match(html, /data-blog-video="youtube"/);
});

test("hasMeaningfulBlogContent rejects empty markup and accepts media", () => {
  assert.equal(hasMeaningfulBlogContent("<p><br></p>"), false);
  assert.equal(hasMeaningfulBlogContent("<p>&nbsp;</p>"), false);
  assert.equal(hasMeaningfulBlogContent("<p>Nội dung</p>"), true);
  assert.equal(hasMeaningfulBlogContent('<img src="/blog-media/example.webp">'), true);
});
