CREATE TABLE "TemplateHeroTypography" (
  "slug" TEXT NOT NULL PRIMARY KEY,
  "fontFamily" TEXT NOT NULL DEFAULT '',
  "bold" BOOLEAN,
  "italic" BOOLEAN,
  "updatedAt" DATETIME NOT NULL
);
