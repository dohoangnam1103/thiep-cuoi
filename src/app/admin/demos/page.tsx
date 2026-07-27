import Link from "next/link";

import { verifyAdmin } from "@/lib/admin-dal";
import { prisma } from "@/lib/prisma";
import {
  defaultTemplateLabel,
  getTemplateLabelOverrides,
  getTemplateLabels,
  labelFromMap,
} from "@/lib/template-labels";
import { TemplateNameForm } from "./TemplateNameForm";

export default async function AdminDemosPage() {
  await verifyAdmin();

  const [demos, labels, overrides] = await Promise.all([
    prisma.invitation.findMany({
      where: { isDemo: true },
      orderBy: { templateId: "asc" },
      include: { content: { select: { brideFullName: true, groomFullName: true } } },
    }),
    getTemplateLabels(),
    getTemplateLabelOverrides(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl text-foreground">Thiệp demo ({demos.length})</h1>
      <p className="text-sm text-muted-foreground">
        Tên mẫu thiệp áp dụng cho trang quản lý, danh sách thiệp của khách, bộ chọn mẫu trong trình
        chỉnh sửa và cả trang giới thiệu công khai (mọi ngôn ngữ). Để trống để dùng lại tên mặc định
        theo bản dịch.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Mẫu thiệp</th>
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
                  c && (c.brideFullName || c.groomFullName)
                    ? `${c.groomFullName} & ${c.brideFullName}`.trim()
                    : "—";
                return (
                  <tr key={demo.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3">
                      <TemplateNameForm
                        templateId={demo.templateId}
                        name={labelFromMap(labels, demo.templateId)}
                        defaultName={defaultTemplateLabel(demo.templateId)}
                        isRenamed={Boolean(overrides[demo.templateId])}
                      />
                    </td>
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
