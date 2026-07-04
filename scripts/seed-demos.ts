import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";
import { chungdoiDemoContent } from "@/data/chungdoi-demo-content";
import { fromDemoContent } from "@/lib/from-demo-content";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

const SYSTEM_EMAIL = "system@demo.local";

async function main() {
  const system = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    create: { email: SYSTEM_EMAIL, passwordHash: "" },
    update: {},
  });

  const entries = Object.entries(chungdoiDemoContent);
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

  console.log(`Seeded ${count} demo invitation(s) as user ${SYSTEM_EMAIL}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
