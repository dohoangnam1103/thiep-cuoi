-- Persist canonical template-demo slugs separately from display names while
-- retaining every previous slug as a redirectable alias.
CREATE TABLE "TemplateRouteAlias" (
    "routeSlug" TEXT NOT NULL PRIMARY KEY,
    "templateSlug" TEXT NOT NULL,
    "canonical" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- SQLite permits multiple NULL values here, so each template can have many
-- historical aliases but at most one row whose canonical marker is TRUE.
CREATE UNIQUE INDEX "TemplateRouteAlias_templateSlug_canonical_key"
ON "TemplateRouteAlias"("templateSlug", "canonical");

CREATE INDEX "TemplateRouteAlias_templateSlug_idx"
ON "TemplateRouteAlias"("templateSlug");
