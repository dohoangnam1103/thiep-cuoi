import { readFile } from "node:fs/promises";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

type TrackSeed = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  tags: string[];
  status: string;
  youtubeUrl: string | null;
  submittedBy: string | null;
  errorMessage: string | null;
  market: string;
  reviewedAt: string | null;
  addedAt: string;
};

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const tracks = JSON.parse(
    await readFile(new URL("./tracks.json", import.meta.url), "utf8"),
  ) as TrackSeed[];

  for (const track of tracks) {
    const data = {
      ...track,
      tags: JSON.stringify(track.tags),
      reviewedAt: track.reviewedAt ? new Date(track.reviewedAt) : null,
      addedAt: new Date(track.addedAt),
    };

    await prisma.track.upsert({
      where: { id: track.id },
      create: data,
      update: data,
    });
  }

  console.log(`Seeded ${tracks.length} tracks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
