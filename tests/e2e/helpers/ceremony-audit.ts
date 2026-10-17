import { randomUUID } from "node:crypto";
import { templates } from "@/data/chungdoi";
import { getDb } from "./db";
import { createInvitation, createUser, publishInvitation } from "./fixtures";

export const CEREMONY_AUDIT_USER = "ceremony-audit-fixtures@e2e.test";
export const CEREMONY_AUDIT_ITEMS = [
  { title: "LỄ VU QUY KIỂM TRA", date: "2031-01-11", time: "09:31" },
  { title: "LỄ TÂN HÔN KIỂM TRA", date: "2032-02-22", time: "11:07" },
  { title: "LỄ THÀNH HÔN KIỂM TRA", date: "2033-03-30", time: "13:43" },
];

export function prepareCeremonyAuditFixtures() {
  const db = getDb();
  db.prepare("UPDATE AppConfig SET cover3dEnabled = 0 WHERE id = 'default'").run();
  const user = createUser({ email: CEREMONY_AUDIT_USER });
  for (const template of templates) {
    const invitation = createInvitation(user.id, { templateId: template.slug, isDemo: true });
    publishInvitation(invitation.id, {
      brideFullName: "Trần An Nhiên", groomFullName: "Nguyễn Minh Khôi",
      brideShortName: "An Nhiên", groomShortName: "Minh Khôi",
      date: "2026-11-07", time: "18:00", banquetTime: "18:00",
      ceremonyHeader: CEREMONY_AUDIT_ITEMS[0].title,
      ceremonyDate: CEREMONY_AUDIT_ITEMS[0].date,
      ceremonyTime: CEREMONY_AUDIT_ITEMS[0].time,
    });
    for (const [index, ceremony] of CEREMONY_AUDIT_ITEMS.entries()) {
      db.prepare("INSERT INTO CeremonyItem (id, invitationId, title, date, time, sortOrder) VALUES (?, ?, ?, ?, ?, ?)")
        .run(randomUUID(), invitation.id, ceremony.title, ceremony.date, ceremony.time, index);
    }
  }
}
