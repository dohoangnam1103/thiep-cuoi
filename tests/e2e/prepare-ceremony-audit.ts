import { prepareCeremonyAuditFixtures } from "./helpers/ceremony-audit";

// Run immediately after prepare-db and before Next's build/server readiness
// requests, so the demo cache cannot capture a null fixture for the first test.
prepareCeremonyAuditFixtures();
