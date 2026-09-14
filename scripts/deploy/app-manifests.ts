// Single source of truth for per-app deployment parameters.
// Master stays pinned to its historical paths; site-2 gets fully isolated
// directories, image/container names, ports, backups and markers.
// Secret VALUES never appear here — only environment variable names.

export type AppId = "master" | "site-2";

export type AppManifest = {
  appId: AppId;
  /** Env var carrying the public origin baked in at build time. */
  publicUrlEnv: "NEXT_PUBLIC_SITE_URL";
  /** Remote application root (host directory). */
  remoteAppDir: string;
  webImage: string;
  webContainer: string;
  composeProject: string;
  /** Loopback-only origin port on the VPS (tunnel/proxy attaches here). */
  webPort: number;
  /** SQLite path inside the container. */
  databaseContainerPath: string;
  /** Media root inside the container. */
  mediaContainerPath: string;
  /** Host data volume (database + media live here). */
  dataHostDir: string;
  /** Host backups directory. */
  backupDir: string;
  /** Timer names installed for this app (site-2 MVP: backups only). */
  timerNames: string[];
  liveMarker: string;
  retiredMarker: string;
  healthEndpoint: string;
};

function manifest(
  appId: AppId,
  remoteAppDir: string,
  webName: string,
  webPort: number,
  timerNames: string[],
): AppManifest {
  return {
    appId,
    publicUrlEnv: "NEXT_PUBLIC_SITE_URL",
    remoteAppDir,
    webImage: `${webName}:production`,
    webContainer: webName,
    composeProject: webName,
    webPort,
    databaseContainerPath: "file:/app/data/prod.db",
    mediaContainerPath: "/app/data/media",
    dataHostDir: `${remoteAppDir}/data`,
    backupDir: `${remoteAppDir}/backups`,
    timerNames,
    liveMarker: `${remoteAppDir}/LIVE`,
    retiredMarker: `${remoteAppDir}/RETIRED`,
    healthEndpoint: "/api/health",
  };
}

export const APP_MANIFESTS: Record<AppId, AppManifest> = {
  master: manifest(
    "master",
    "/srv/thiepmungonline",
    "thiepmungonline-web",
    3211,
    ["thiepmungonline-backup", "thiepmungonline-reconcile", "thiepmungonline-reminders"],
  ),
  "site-2": manifest(
    "site-2",
    "/srv/chungdoi-site2",
    "chungdoi-site2-web",
    3221,
    ["chungdoi-site2-backup"],
  ),
};

export function getAppManifest(appId: string): AppManifest {
  const found = (APP_MANIFESTS as Record<string, AppManifest>)[appId];
  if (!found) {
    throw new Error(`Unknown app: ${appId} (expected master or site-2)`);
  }
  return found;
}

// CLI: npx tsx scripts/deploy/app-manifests.ts <appId> → JSON on stdout.
const requested = process.argv[2];
if (requested) {
  console.log(JSON.stringify(getAppManifest(requested), null, 2));
}
