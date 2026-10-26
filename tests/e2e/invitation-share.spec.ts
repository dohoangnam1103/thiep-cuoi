import { writeFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";
import sharp from "sharp";

import { getDb } from "./helpers/db";
import { cleanupUser, createInvitation, createUser, publishInvitation } from "./helpers/fixtures";

test("share crawlers receive a versioned, accessible PNG that refreshes after editing the date", async ({ request }, testInfo) => {
  const user = createUser();
  try {
    const invitation = createInvitation(user.id, { templateId: "minimalism-dark-red" });
    const slug = publishInvitation(invitation.id, {
      brideShortName: "Lê Thị Hậu",
      groomShortName: "Lê Văn Long",
      brideFullName: "Lê Thị Hậu",
      groomFullName: "Lê Văn Long",
      date: "2026-12-05",
    });
    getDb().prepare("UPDATE InvitationContent SET brideFirst = 0 WHERE invitationId = ?").run(invitation.id);

    const imageUrlFromHead = async (userAgent: string) => {
      const response = await request.get(`/thiep/${slug}`, { headers: { "User-Agent": userAgent } });
      expect(response.status()).toBe(200);
      const head = (await response.text()).split("</head>")[0];
      const images = [...head.matchAll(/<meta property="og:image" content="([^"]+)"/g)];
      expect(images).toHaveLength(1);
      const url = images[0][1].replaceAll("&amp;", "&");
      expect(url).toMatch(/\/opengraph-image\?v=[a-f0-9]{16}$/);
      expect(head).toContain('property="og:image:width" content="1200"');
      expect(head).toContain('property="og:image:height" content="630"');
      expect(head).toContain(`property="og:image:secure_url" content="${url}"`);
      expect(head).toContain(`name="twitter:image" content="${url}"`);
      // The public canonical link must keep its existing URL.
      expect(head).toContain(`property="og:url" content="${new URL(url).origin}/thiep/${slug}"`);
      return url;
    };

    const beforeUrl = await imageUrlFromHead("facebookexternalhit/1.1");
    const beforeImage = await request.get(beforeUrl);
    expect(beforeImage.status()).toBe(200);
    const beforeBytes = await beforeImage.body();
    getDb().prepare("UPDATE InvitationContent SET date = ? WHERE invitationId = ?").run("2026-12-06", invitation.id);

    for (const userAgent of ["facebookexternalhit/1.1", "Facebot", "meta-externalfetcher/1.1", "ZaloPC-win32/24.8.4"]) {
      const url = await imageUrlFromHead(userAgent);
      expect(url).not.toBe(beforeUrl);
      const response = await request.get(url, { headers: { "User-Agent": userAgent } });
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      const bytes = await response.body();
      expect(bytes.equals(beforeBytes)).toBe(false);
      const image = await sharp(bytes).metadata();
      expect(image.width).toBe(1200);
      expect(image.height).toBe(630);
      expect(bytes.length).toBeLessThan(8 * 1024 * 1024);
      if (userAgent === "facebookexternalhit/1.1") {
        const imagePath = testInfo.outputPath("long-hau-share-06-12-2026.png");
        await writeFile(imagePath, bytes);
        await testInfo.attach("long-hau-share-06-12-2026", { path: imagePath, contentType: "image/png" });
      }
    }

    // The previous image endpoint remains compatible with previously shared URLs.
    expect((await request.get(`/thiep/${slug}/opengraph-image`)).status()).toBe(200);

    getDb().prepare(`UPDATE InvitationContent SET brideShortName = ?, groomShortName = ? WHERE invitationId = ?`)
      .run("Nguyễn Thị Hoàng Phương Anh", "Trần Nguyễn Hoàng Minh Quân", invitation.id);
    const longNames = await request.get(await imageUrlFromHead("facebookexternalhit/1.1"));
    expect(longNames.status()).toBe(200);
    const longNamesPath = testInfo.outputPath("long-names-share.png");
    await writeFile(longNamesPath, await longNames.body());
    await testInfo.attach("long-names-share", { path: longNamesPath, contentType: "image/png" });
  } finally {
    cleanupUser(user.id);
  }
});
