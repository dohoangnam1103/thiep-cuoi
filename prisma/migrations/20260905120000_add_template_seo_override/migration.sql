-- Marketing-editable SEO copy for the public template landing page. One row per
-- source template slug; a missing row keeps the built-in catalog copy.
CREATE TABLE "TemplateSeoOverride" (
    "slug" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "robots" TEXT NOT NULL DEFAULT 'index,follow',
    "updatedBy" TEXT,
    "updatedAt" DATETIME NOT NULL
);
