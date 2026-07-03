"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

import type { InvitationContent } from "@/generated/prisma/client";
import { saveDraft, publish, checkSlug, type EditorState } from "./actions";
import { VALID_TEMPLATE_IDS } from "./templates";

type EditorFormProps = {
  invitationId: string;
  status: string;
  currentSlug: string | null;
  templateId: string;
  content: InvitationContent | null;
  schedule: { time: string; label: string }[];
  gallery: string[];
};

const TEMPLATE_LABELS: Record<(typeof VALID_TEMPLATE_IDS)[number], string> = {
  "double-phoenix-red": "Song Phụng Đỏ",
  "double-phoenix-green": "Song Phụng Xanh",
  "song-hy-red": "Song Hỷ Đỏ",
  "song-hy-green": "Song Hỷ Xanh",
  "nhat-binh-red": "Nhật Bình Đỏ",
  "co-ba-red": "Cô Ba Đỏ",
  "dragon-phoenix-red": "Long Phụng Đỏ",
  "double-dragon-red": "Song Long Đỏ",
  "double-dragon-blue": "Song Long Xanh Dương",
  "double-dragon-green": "Song Long Xanh Lá",
};

function field(content: InvitationContent | null, key: keyof InvitationContent): string {
  const v = content?.[key];
  return typeof v === "string" ? v : "";
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-[#fb3570]";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

function Accordion({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#1c1512]/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 font-pattaya text-xl text-[#fb3570]">
          <span aria-hidden>{icon}</span>
          {title}
        </span>
        <span className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
          ⌄
        </span>
      </button>
      <div className={open ? "px-5 pb-5" : "hidden"}>{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Text({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
  type = "text",
  full,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function ColorField({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue || "#c8102e");
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#c8102e"}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-black/30"
          aria-label={`${label} - bảng màu`}
        />
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#c8102e"
          className={inputClass}
        />
      </div>
    </div>
  );
}

function SubHeader({ children }: { children: React.ReactNode }) {
  return <p className="sm:col-span-2 -mb-1 text-sm font-semibold text-zinc-300">{children}</p>;
}

export function EditorForm({
  invitationId,
  status,
  currentSlug,
  templateId,
  content,
  schedule,
  gallery,
}: EditorFormProps) {
  const saveAction = saveDraft.bind(null, invitationId);
  const publishAction = publish.bind(null, invitationId);
  const [saveState, saveFormAction, saving] = useActionState<EditorState, FormData>(saveAction, undefined);
  const [publishState, publishFormAction, publishing] = useActionState<EditorState, FormData>(
    publishAction,
    undefined,
  );

  const [scheduleRows, setScheduleRows] = useState(schedule.length ? schedule : [{ time: "", label: "" }]);
  const [galleryRows, setGalleryRows] = useState(gallery.length ? gallery : [""]);

  const [slug, setSlug] = useState(currentSlug ?? "");
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checking, startCheck] = useTransition();

  function onCheckSlug() {
    if (!slug.trim()) {
      setSlugStatus({ available: false, reason: "Chưa nhập đường dẫn" });
      return;
    }
    startCheck(async () => {
      const result = await checkSlug(slug, invitationId);
      setSlugStatus(result);
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Bảng điều khiển
          </Link>
          <h1 className="mt-1 font-pattaya text-3xl text-white">Chỉnh sửa thiệp</h1>
          <p className="text-sm text-zinc-500">
            Trạng thái: {status === "published" ? "Đã xuất bản" : "Bản nháp"}
          </p>
        </div>
        <Link
          href={`/editor/${invitationId}/preview`}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Xem trước
        </Link>
      </div>

      <form action={saveFormAction} className="space-y-4" id="editor-form">
        <Accordion title="Thông tin cơ bản" icon="♡">
          <Grid>
            <div className="sm:col-span-2">
              <label htmlFor="templateId" className={labelClass}>
                Mẫu thiệp
              </label>
              <select id="templateId" name="templateId" defaultValue={templateId} className={inputClass}>
                {VALID_TEMPLATE_IDS.map((id) => (
                  <option key={id} value={id} className="bg-[#1c1512]">
                    {TEMPLATE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
            <Text
              name="brideFullName"
              label="Họ tên cô dâu"
              defaultValue={field(content, "brideFullName")}
              placeholder="VD: Nguyễn Quỳnh Anh"
              hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
            />
            <Text
              name="groomFullName"
              label="Họ tên chú rể"
              defaultValue={field(content, "groomFullName")}
              placeholder="VD: Trần Gia Khánh"
              hint="Họ tên đầy đủ, hiển thị ở phần giới thiệu."
            />
            <Text
              name="brideShortName"
              label="Tên gọi cô dâu"
              defaultValue={field(content, "brideShortName")}
              placeholder="VD: Quỳnh Anh"
              hint="Tên ngắn để in to trên thiệp (VD: Quỳnh Anh & Gia Khánh)."
            />
            <Text
              name="groomShortName"
              label="Tên gọi chú rể"
              defaultValue={field(content, "groomShortName")}
              placeholder="VD: Gia Khánh"
              hint="Tên ngắn để in to trên thiệp."
            />
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="brideFirst"
                name="brideFirst"
                type="checkbox"
                value="true"
                defaultChecked={content?.brideFirst ?? true}
                className="size-4 accent-[#fb3570]"
              />
              <label htmlFor="brideFirst" className="text-sm text-zinc-300">
                Hiển thị cô dâu trước
              </label>
            </div>
            <Text name="date" label="Ngày cưới" type="date" defaultValue={field(content, "date")} hint="Ngày tổ chức chính, hiển thị nổi bật trên thiệp." />
            <Text name="time" label="Giờ cưới" type="time" defaultValue={field(content, "time")} />
            <Text name="ceremonyDate" label="Ngày lễ" type="date" defaultValue={field(content, "ceremonyDate")} hint="Ngày lễ vu quy/thành hôn nếu khác ngày cưới." />
            <Text name="ceremonyTime" label="Giờ lễ" type="time" defaultValue={field(content, "ceremonyTime")} />
            <Text
              name="ceremonyHeader"
              label="Tiêu đề lễ"
              defaultValue={field(content, "ceremonyHeader")}
              placeholder="VD: Lễ Thành Hôn"
              hint="Dòng chữ đặt trên phần thông tin lễ (VD: Lễ Vu Quy, Lễ Thành Hôn)."
              full
            />
            <ColorField name="primaryColor" label="Màu chủ đạo" defaultValue={field(content, "primaryColor")} />
          </Grid>
        </Accordion>

        <Accordion title="Thông tin gia đình" icon="⌂">
          <Grid>
            <SubHeader>Nhà trai</SubHeader>
            <Text name="groomFather" label="Cha chú rể" defaultValue={field(content, "groomFather")} placeholder="VD: Ông Trần Văn Minh" />
            <Text name="groomMother" label="Mẹ chú rể" defaultValue={field(content, "groomMother")} placeholder="VD: Bà Phạm Thị Hoa" />
            <Text
              name="groomParentTitle"
              label="Danh xưng nhà trai"
              defaultValue={field(content, "groomParentTitle")}
              placeholder="VD: Song thân"
              hint="Cách gọi cha mẹ trên thiệp (VD: Song thân, Gia đình)."
            />
            <Text name="groomAddress" label="Địa chỉ nhà trai" defaultValue={field(content, "groomAddress")} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" full />

            <SubHeader>Nhà gái</SubHeader>
            <Text name="brideFather" label="Cha cô dâu" defaultValue={field(content, "brideFather")} placeholder="VD: Ông Nguyễn Văn Hưng" />
            <Text name="brideMother" label="Mẹ cô dâu" defaultValue={field(content, "brideMother")} placeholder="VD: Bà Trần Thị Lan" />
            <Text
              name="brideParentTitle"
              label="Danh xưng nhà gái"
              defaultValue={field(content, "brideParentTitle")}
              placeholder="VD: Song thân"
              hint="Cách gọi cha mẹ trên thiệp (VD: Song thân, Gia đình)."
            />
            <Text name="brideAddress" label="Địa chỉ nhà gái" defaultValue={field(content, "brideAddress")} placeholder="Số nhà, đường, phường/xã, tỉnh/thành" full />
          </Grid>
        </Accordion>

        <Accordion title="Tiệc cưới" icon="✦">
          <Grid>
            <Text
              name="address"
              label="Địa chỉ"
              defaultValue={field(content, "address")}
              placeholder="VD: Trung tâm tiệc cưới ABC, 123 Lê Lợi, Q.1, TP.HCM"
              hint="Địa chỉ hiển thị trên thiệp cho khách xem."
              full
            />
            <Text
              name="mapAddress"
              label="Địa chỉ bản đồ"
              defaultValue={field(content, "mapAddress")}
              placeholder="Dán địa chỉ hoặc tên nơi tổ chức để tìm trên Google Maps"
              hint="Dùng để nhúng bản đồ chỉ đường. Nên dán đúng như trên Google Maps."
              full
            />
            <Text
              name="banquetTime"
              label="Giờ đãi tiệc"
              defaultValue={field(content, "banquetTime")}
              placeholder="VD: 18:00 Thứ Bảy, 14/06/2026"
            />
          </Grid>
        </Accordion>

        <Accordion title="Chương trình" icon="✿">
          <p className="mb-3 text-xs text-zinc-500">
            Các mốc thời gian trong ngày cưới, ví dụ: 09:00 Lễ Vu Quy, 11:00 Đón khách, 18:00 Khai tiệc.
          </p>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setScheduleRows((r) => [...r, { time: "", label: "" }])}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5"
            >
              + Thêm mốc
            </button>
          </div>
          <div className="space-y-3">
            {scheduleRows.map((row, i) => (
              <div key={i} className="flex gap-3">
                <input
                  name="scheduleTime"
                  type="time"
                  defaultValue={row.time}
                  className={`${inputClass} w-32`}
                />
                <input name="scheduleLabel" defaultValue={row.label} placeholder="Lễ Vu Quy" className={inputClass} />
                <button
                  type="button"
                  onClick={() => setScheduleRows((r) => r.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Album ảnh" icon="◱">
          <p className="mb-3 text-xs text-zinc-500">
            Dán đường dẫn ảnh (URL) để hiển thị trong album của thiệp. Mỗi dòng là một ảnh, tối đa 30 ảnh.
          </p>
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={() => setGalleryRows((r) => [...r, ""])}
              className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white hover:bg-white/5"
            >
              + Thêm ảnh
            </button>
          </div>
          <div className="space-y-3">
            {galleryRows.map((url, i) => (
              <div key={i} className="flex gap-3">
                <input
                  name="galleryUrl"
                  defaultValue={url}
                  placeholder="/chungdoi/images/... hoặc URL ảnh"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setGalleryRows((r) => r.filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-lg border border-white/10 px-3 text-sm text-zinc-400 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </Accordion>

        <Accordion title="Font & Nhạc" icon="♪" defaultOpen={false}>
          <Grid>
            <Text name="fontFamily" label="Font chữ" defaultValue={field(content, "fontFamily")} />
            <Text name="music" label="Nhạc nền (URL)" defaultValue={field(content, "music")} />
          </Grid>
        </Accordion>

        <Accordion title="Thông tin chuyển khoản" icon="✉" defaultOpen={false}>
          <Grid>
            <SubHeader>Nhà trai</SubHeader>
            <Text name="groomBankName" label="Ngân hàng chú rể" defaultValue={field(content, "groomBankName")} />
            <Text name="groomAccountNumber" label="Số tài khoản chú rể" defaultValue={field(content, "groomAccountNumber")} />
            <Text name="groomAccountName" label="Chủ tài khoản chú rể" defaultValue={field(content, "groomAccountName")} full />

            <SubHeader>Nhà gái</SubHeader>
            <Text name="brideBankName" label="Ngân hàng cô dâu" defaultValue={field(content, "brideBankName")} />
            <Text name="brideAccountNumber" label="Số tài khoản cô dâu" defaultValue={field(content, "brideAccountNumber")} />
            <Text name="brideAccountName" label="Chủ tài khoản cô dâu" defaultValue={field(content, "brideAccountName")} full />
          </Grid>
        </Accordion>

        {saveState?.error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{saveState.error}</p>
        ) : null}
        {saveState?.ok ? (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Đã lưu bản nháp</p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-white/10 px-6 py-2.5 font-bold text-white transition hover:bg-white/15 disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu bản nháp"}
        </button>
      </form>

      <section className="mt-8 rounded-2xl border border-[#fb3570]/30 bg-[#fb3570]/5 p-5">
        <h2 className="mb-4 font-pattaya text-xl text-[#fb3570]">Xuất bản</h2>
        <form action={publishFormAction} className="space-y-3">
          <label htmlFor="slug" className={labelClass}>
            Đường dẫn công khai
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">/thiep/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugStatus(null);
              }}
              placeholder="quynh-anh-gia-khanh"
              className={inputClass}
            />
            <button
              type="button"
              onClick={onCheckSlug}
              disabled={checking}
              className="shrink-0 rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:bg-white/5 disabled:opacity-60"
            >
              {checking ? "..." : "Kiểm tra"}
            </button>
          </div>
          {slugStatus ? (
            <p className={`text-sm ${slugStatus.available ? "text-emerald-300" : "text-red-300"}`}>
              {slugStatus.available ? "Đường dẫn khả dụng" : slugStatus.reason}
            </p>
          ) : null}
          {publishState?.error ? (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{publishState.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={publishing}
            className="rounded-full bg-[#fb3570] px-6 py-2.5 font-bold text-white shadow-lg shadow-[#fb3570]/25 transition hover:bg-[#ff4a82] disabled:opacity-60"
          >
            {publishing ? "Đang xuất bản..." : "Xuất bản thiệp"}
          </button>
          <p className="text-xs text-zinc-500">Nhớ lưu bản nháp trước khi xuất bản.</p>
        </form>
      </section>
    </div>
  );
}
