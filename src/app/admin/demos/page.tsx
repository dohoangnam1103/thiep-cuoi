import Link from "next/link";

import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";

export default async function AdminDemosPage() {
  await verifyAdmin();

  const demos = await prisma.invitation.findMany({
    where: { isDemo: true },
    orderBy: { templateId: "asc" },
    include: { content: { select: { brideShortName: true, groomShortName: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-foreground">Thiệp demo ({demos.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Cặp đôi</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {demos.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Chưa có thiệp demo nào.
                </td>
              </tr>
            ) : (
              demos.map((demo) => {
                const c = demo.content;
                const couple =
                  c && (c.brideShortName || c.groomShortName)
                    ? `${c.groomShortName} & ${c.brideShortName}`.trim()
                    : "—";
                return (
                  <tr key={demo.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{demo.templateId}</td>
                    <td className="px-4 py-3">{couple}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/demos/${demo.id}`} className="text-sm text-primary hover:underline">
                        Sửa
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
