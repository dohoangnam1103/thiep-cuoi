"use client";

import { useActionState, useState, useTransition } from "react";

import type { TemplateSeoDetailContent } from "@/data/template-seo-details";

import { resetTemplateSeo, saveTemplateSeo, type TemplateSeoFormState } from "../../seo-actions";

type Candidate = { slug: string; name?: string; title?: string };

const INPUT_CLASS =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring";

/** One editable row of a repeatable text list, with add/remove controls. */
function TextList({
  name,
  label,
  hint,
  values,
  fixedLength,
}: {
  name: string;
  label: string;
  hint?: string;
  values: string[];
  /** Set for `steps`, whose count the public page contract pins. */
  fixedLength?: number;
}) {
  const [items, setItems] = useState(values.length > 0 ? values : [""]);

  const update = (index: number, value: string) =>
    setItems(items.map((item, position) => (position === index ? value : item)));

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {items.map((item, index) => (
        <div key={`${name}-${index}`} className="flex gap-2">
          <input
            name={name}
            value={item}
            onChange={(event) => update(index, event.target.value)}
            aria-label={`${label} ${index + 1}`}
            className={INPUT_CLASS}
          />
          {fixedLength === undefined && items.length > 1 ? (
            <button
              type="button"
              onClick={() => setItems(items.filter((_, position) => position !== index))}
              className="shrink-0 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-destructive"
            >
              Xoá
            </button>
          ) : null}
        </div>
      ))}
      {fixedLength === undefined ? (
        <button
          type="button"
          onClick={() => setItems([...items, ""])}
          className="text-xs font-semibold text-primary hover:underline"
        >
          + Thêm dòng
        </button>
      ) : null}
    </fieldset>
  );
}

/** Repeatable question/answer pairs; each pair stays index-aligned on submit. */
function FaqList({ values }: { values: Array<{ question: string; answer: string }> }) {
  const [items, setItems] = useState(
    values.length > 0 ? values : [{ question: "", answer: "" }],
  );

  const update = (index: number, patch: Partial<{ question: string; answer: string }>) =>
    setItems(items.map((item, position) =>
      position === index ? { ...item, ...patch } : item));

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-foreground">Câu hỏi thường gặp (FAQ)</legend>
      <p className="text-xs text-muted-foreground">
        Mỗi cặp câu hỏi/trả lời được xuất ra schema FAQPage cho Google. Cần ít nhất 1 cặp.
      </p>
      {items.map((item, index) => (
        <div key={`faq-${index}`} className="space-y-2 rounded-xl border border-border/70 p-3">
          <input
            name="faqQuestion"
            value={item.question}
            onChange={(event) => update(index, { question: event.target.value })}
            placeholder="Câu hỏi"
            aria-label={`Câu hỏi ${index + 1}`}
            className={INPUT_CLASS}
          />
          <textarea
            name="faqAnswer"
            value={item.answer}
            onChange={(event) => update(index, { answer: event.target.value })}
            placeholder="Trả lời"
            aria-label={`Trả lời ${index + 1}`}
            rows={3}
            className={INPUT_CLASS}
          />
          {items.length > 1 ? (
            <button
              type="button"
              onClick={() => setItems(items.filter((_, position) => position !== index))}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Xoá cặp này
            </button>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems([...items, { question: "", answer: "" }])}
        className="text-xs font-semibold text-primary hover:underline"
      >
        + Thêm câu hỏi
      </button>
    </fieldset>
  );
}

export function TemplateSeoForm({
  sourceSlug,
  templateName,
  publicPath,
  demoId,
  initialContent,
  initialRobots,
  isOverridden,
  relatedCandidates,
  blogCandidates,
  previewImage,
}: {
  sourceSlug: string;
  templateName: string;
  publicPath: string;
  demoId: string;
  initialContent: TemplateSeoDetailContent;
  initialRobots: string;
  isOverridden: boolean;
  relatedCandidates: Candidate[];
  blogCandidates: Candidate[];
  previewImage: string;
}) {
  const action = saveTemplateSeo.bind(null, sourceSlug);
  const [state, formAction, pending] = useActionState<TemplateSeoFormState | undefined, FormData>(
    action,
    undefined,
  );
  const [resetting, startReset] = useTransition();
  const [metaTitle, setMetaTitle] = useState(initialContent.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initialContent.metaDescription);

  const fieldErrors = state && !state.ok ? state.fieldErrors ?? {} : {};
  const errorFor = (field: string) => fieldErrors[field];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl text-foreground">Nội dung SEO — {templateName}</h1>
        <p className="text-sm text-muted-foreground">
          Nội dung ở đây thay thế toàn bộ text của{" "}
          <a href={publicPath} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {publicPath}
          </a>
          . Lưu xong, trang bên ngoài được render lại ngay, không cần deploy.
        </p>
        <p className="text-xs text-muted-foreground">
          Đang dùng:{" "}
          <strong>{isOverridden ? "nội dung do marketing nhập" : "nội dung mặc định của hệ thống"}</strong>
          {" · "}Mã mẫu: <code>{sourceSlug}</code>
        </p>
      </header>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="slug" value={sourceSlug} />

        {/* ----- Metadata ----- */}
        <section className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <h2 className="font-semibold text-foreground">Thẻ meta &amp; kết quả tìm kiếm</h2>

          <div className="space-y-1">
            <label htmlFor="metaTitle" className="text-sm font-semibold text-foreground">
              Meta title
            </label>
            <input
              id="metaTitle"
              name="metaTitle"
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value)}
              maxLength={120}
              className={INPUT_CLASS}
            />
            <p className={`text-xs ${metaTitle.length > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
              {metaTitle.length}/120 ký tự — Google hiển thị khoảng 60 ký tự đầu.
            </p>
            {errorFor("metaTitle") ? <p className="text-xs text-destructive">{errorFor("metaTitle")}</p> : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="metaDescription" className="text-sm font-semibold text-foreground">
              Meta description
            </label>
            <textarea
              id="metaDescription"
              name="metaDescription"
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value)}
              maxLength={320}
              rows={3}
              className={INPUT_CLASS}
            />
            <p className={`text-xs ${metaDescription.length > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
              {metaDescription.length}/320 ký tự — Google hiển thị khoảng 160 ký tự đầu.
            </p>
            {errorFor("metaDescription") ? <p className="text-xs text-destructive">{errorFor("metaDescription")}</p> : null}
          </div>

          {/* SERP preview: shows exactly what the snippet looks like. */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Xem trước trên Google
            </p>
            <p className="truncate text-sm text-emerald-700">
              thiepmungonline.com{publicPath}
            </p>
            <p className="truncate text-base text-blue-700">
              {metaTitle.slice(0, 60) || "Meta title"}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {metaDescription.slice(0, 160) || "Meta description"}
            </p>
          </div>

          {/*
            Not an editable field. A landing page that flips to `noindex` drops
            out of Google for days, and the ranking loss outlasts the mistake,
            so indexing is a code-level decision shown here only for context.
          */}
          <div className="space-y-1">
            <span className="text-sm font-semibold text-foreground">Robots</span>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <code className="rounded bg-muted px-2 py-1 text-xs text-foreground">{initialRobots}</code>
              <span className="text-xs">
                {initialRobots.startsWith("index")
                  ? "Trang đang được Google index."
                  : "CẢNH BÁO: trang đang bị chặn index. Liên hệ kỹ thuật nếu ngoài ý muốn."}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Không sửa được ở đây: đổi trạng thái index có thể làm mất thứ hạng và cần sửa trong code.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
            <img
              src={previewImage}
              alt=""
              className="h-auto w-full rounded-xl border border-border object-cover"
            />
            <div className="space-y-1">
              <label htmlFor="imageAlt" className="text-sm font-semibold text-foreground">
                Alt text ảnh xem trước
              </label>
              <input id="imageAlt" name="imageAlt" defaultValue={initialContent.imageAlt} className={INPUT_CLASS} />
              <p className="text-xs text-muted-foreground">
                Ảnh dùng cho thẻ og:image và schema ImageObject. Đổi ảnh ở tab “Thumbnail mobile”.
              </p>
              {errorFor("imageAlt") ? <p className="text-xs text-destructive">{errorFor("imageAlt")}</p> : null}
            </div>
          </div>
        </section>

        {/* ----- Page copy ----- */}
        <section className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <h2 className="font-semibold text-foreground">Nội dung hiển thị trên trang</h2>

          <div className="space-y-1">
            <label htmlFor="heading" className="text-sm font-semibold text-foreground">
              Tiêu đề H1 và breadcrumb
            </label>
            <input id="heading" name="heading" defaultValue={initialContent.heading} className={INPUT_CLASS} />
            {errorFor("heading") ? <p className="text-xs text-destructive">{errorFor("heading")}</p> : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="intro" className="text-sm font-semibold text-foreground">
              Đoạn mở đầu
            </label>
            <textarea id="intro" name="intro" defaultValue={initialContent.intro} rows={7} className={INPUT_CLASS} />
            <p className="text-xs text-muted-foreground">
              Cách một dòng trống để tách đoạn: đoạn đầu nằm cạnh ảnh, các đoạn sau xuống mục “Về thiết kế”.
            </p>
            {errorFor("intro") ? <p className="text-xs text-destructive">{errorFor("intro")}</p> : null}
          </div>

          <TextList
            name="highlights"
            label="Điểm nhấn (mục nổi bật)"
            values={initialContent.highlights}
          />
          {errorFor("highlights") ? <p className="text-xs text-destructive">{errorFor("highlights")}</p> : null}

          <TextList
            name="suitableFor"
            label="Phù hợp với (thẻ tròn)"
            values={initialContent.suitableFor}
          />
          {errorFor("suitableFor") ? <p className="text-xs text-destructive">{errorFor("suitableFor")}</p> : null}

          <TextList
            name="features"
            label="Tính năng"
            values={initialContent.features}
          />
          {errorFor("features") ? <p className="text-xs text-destructive">{errorFor("features")}</p> : null}

          <TextList
            name="steps"
            label="Các bước tạo thiệp"
            hint="Cố định 3 bước theo bố cục trang."
            values={initialContent.steps}
            fixedLength={3}
          />
          {errorFor("steps") ? <p className="text-xs text-destructive">{errorFor("steps")}</p> : null}

          <FaqList values={initialContent.faq} />
          {errorFor("faq") ? <p className="text-xs text-destructive">{errorFor("faq")}</p> : null}
        </section>

        {/* ----- Internal links ----- */}
        <section className="space-y-4 rounded-2xl border border-border bg-background p-4">
          <h2 className="font-semibold text-foreground">Liên kết nội bộ</h2>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Mẫu thiệp liên quan (tối đa 3)</legend>
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {relatedCandidates.map((candidate) => (
                <label key={candidate.slug} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="relatedSlugs"
                    value={candidate.slug}
                    defaultChecked={initialContent.relatedSlugs.includes(candidate.slug)}
                  />
                  {candidate.name ?? candidate.slug}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Chọn nhiều hơn 3 sẽ bị từ chối khi lưu. Mẫu đã ngừng phát hành sẽ tự bị loại.
            </p>
            {errorFor("relatedSlugs") ? <p className="text-xs text-destructive">{errorFor("relatedSlugs")}</p> : null}
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Bài viết liên quan</legend>
            <div className="grid max-h-64 gap-1 overflow-y-auto sm:grid-cols-2">
              {blogCandidates.map((candidate) => (
                <label key={candidate.slug} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    name="relatedBlogSlugs"
                    value={candidate.slug}
                    defaultChecked={initialContent.relatedBlogSlugs.includes(candidate.slug)}
                  />
                  {candidate.title ?? candidate.slug}
                </label>
              ))}
            </div>
            {errorFor("relatedBlogSlugs") ? <p className="text-xs text-destructive">{errorFor("relatedBlogSlugs")}</p> : null}
          </fieldset>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={pending || resetting}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Lưu và render lại trang"}
          </button>
          <a
            href={publicPath}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Mở trang ngoài
          </a>
          <a href={`/admin/demos/${demoId}`} className="text-sm text-muted-foreground hover:underline">
            Sửa nội dung thiệp demo
          </a>
          {isOverridden ? (
            <button
              type="button"
              disabled={pending || resetting}
              onClick={() =>
                startReset(async () => {
                  await resetTemplateSeo(sourceSlug);
                })}
              className="text-sm text-muted-foreground hover:text-destructive disabled:opacity-60"
            >
              {resetting ? "Đang khôi phục..." : "Khôi phục nội dung mặc định"}
            </button>
          ) : null}
        </div>

        {state && !state.ok ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {state.errorCode === "templateNotFound"
              ? "Không tìm thấy mẫu thiệp này."
              : "Dữ liệu chưa hợp lệ. Kiểm tra các ô được báo lỗi bên trên."}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
            Đã lưu. Trang ngoài đang được render lại.
          </p>
        ) : null}
      </form>
    </div>
  );
}
