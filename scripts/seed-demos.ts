import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { completedTemplateSlugs } from "@/data/chungdoi";
import { fromDemoContent } from "@/lib/from-demo-content";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const SYSTEM_EMAIL = "system@demo.local";

// Seed lại một slug là GHI ĐÈ: content bị upsert theo bản tĩnh, schedule và
// gallery bị xoá rồi tạo lại. Chạy trắng cả bảng sẽ thổi bay mọi chỉnh sửa mà
// admin đã làm trong /admin/demos. Nên khi chỉ cần bù mẫu mới, dùng --missing
// (chỉ tạo slug chưa có demo row) kết hợp --completed hoặc --only=<slug,slug>.
type SeedScope = {
  onlySlugs: Set<string> | null;
  missingOnly: boolean;
  completedOnly: boolean;
};

function parseScope(argv: readonly string[]): SeedScope {
  const only = argv.find((arg) => arg.startsWith("--only="));
  return {
    onlySlugs: only
      ? new Set(
          only
            .slice("--only=".length)
            .split(",")
            .map((slug) => slug.trim())
            .filter(Boolean),
        )
      : null,
    missingOnly: argv.includes("--missing"),
    completedOnly: argv.includes("--completed"),
  };
}

async function main() {
  const scope = parseScope(process.argv.slice(2));

  const system = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    create: { email: SYSTEM_EMAIL, passwordHash: "" },
    update: {},
  });

  const existing = new Set(
    (
      await prisma.invitation.findMany({
        where: { isDemo: true },
        select: { templateId: true },
      })
    ).map((row) => row.templateId),
  );

  const entries = Object.entries(chungdoiDemoContent).filter(([slug]) => {
    if (scope.completedOnly && !completedTemplateSlugs.has(slug)) return false;
    if (scope.onlySlugs && !scope.onlySlugs.has(slug)) return false;
    if (scope.missingOnly && existing.has(slug)) return false;
    return true;
  });

  if (scope.onlySlugs) {
    const unknown = [...scope.onlySlugs].filter((slug) => !(slug in chungdoiDemoContent));
    if (unknown.length) {
      throw new Error(`không có content tĩnh cho: ${unknown.join(", ")}`);
    }
  }

  if (entries.length === 0) {
    console.log("Không có demo nào cần seed.");
    return;
  }

  let count = 0;

  for (const [slug, demo] of entries) {
    const id = `demo-${slug}`;
    const seed = fromDemoContent(demo);

    await prisma.$transaction([
      prisma.invitation.upsert({
        where: { id },
        create: {
          id,
          userId: system.id,
          templateId: slug,
          status: "draft",
          isDemo: true,
        },
        update: { userId: system.id, templateId: slug, isDemo: true },
      }),
      prisma.invitationContent.upsert({
        where: { invitationId: id },
        create: { invitationId: id, ...seed.content },
        update: seed.content,
      }),
      prisma.scheduleItem.deleteMany({ where: { invitationId: id } }),
      prisma.galleryPhoto.deleteMany({ where: { invitationId: id } }),
      ...(seed.schedule.length
        ? [
            prisma.scheduleItem.createMany({
              data: seed.schedule.map((s) => ({ invitationId: id, ...s })),
            }),
          ]
        : []),
      ...(seed.gallery.length
        ? [
            prisma.galleryPhoto.createMany({
              data: seed.gallery.map((g) => ({ invitationId: id, ...g })),
            }),
          ]
        : []),
    ]);

    count += 1;
  }

  console.log(
    `Seeded ${count} demo invitation(s) as user ${SYSTEM_EMAIL}: ${entries
      .map(([slug]) => slug)
      .join(", ")}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
