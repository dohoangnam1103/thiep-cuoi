"use client";

import { Node, type Editor } from "@tiptap/core";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Video,
} from "lucide-react";
import {
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";

import { normalizeBlogVideoUrl } from "@/lib/blog-video";
import { EDITOR_IMAGE_ACCEPT } from "@/lib/upload-image-formats";
import { cn } from "@/lib/utils";

type BlogEditorProps = {
  initialContent: string;
  error?: string;
  onChange: (html: string) => void;
};

type ToolbarButtonProps = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

const BlogVideo = Node.create({
  name: "blogVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      type: { default: "youtube" },
      src: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'iframe[data-blog-video="youtube"]',
        getAttrs: (element) => ({
          type: "youtube",
          src: (element as HTMLElement).getAttribute("src") ?? "",
        }),
      },
      {
        tag: 'video[data-blog-video="mp4"]',
        getAttrs: (element) => ({
          type: "mp4",
          src: (element as HTMLElement).getAttribute("src") ?? "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const video = normalizeBlogVideoUrl(String(HTMLAttributes.src ?? ""));
    if (!video) return ["p", {}, "Video không hợp lệ"];

    if (video.type === "youtube") {
      return [
        "iframe",
        {
          src: video.src,
          title: "YouTube video",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          allowfullscreen: "",
          "data-blog-video": "youtube",
        },
      ];
    }

    return [
      "video",
      {
        src: video.src,
        controls: "",
        preload: "metadata",
        "data-blog-video": "mp4",
      },
    ];
  },
});

function ToolbarButton({
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-primary/10 text-primary",
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

async function uploadContentImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("purpose", "content");

  const response = await fetch("/api/admin/blog-media", {
    method: "POST",
    body: formData,
  });
  const result = await response.json() as UploadResponse;
  if (!response.ok || !result.url) {
    throw new Error(result.error || "Không thể upload ảnh");
  }
  return result.url;
}

function setLink(editor: Editor) {
  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Nhập URL liên kết:", previousUrl ?? "https://");
  if (url === null) return;
  if (!url.trim()) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({
    href: url.trim(),
  }).run();
}

function insertVideo(editor: Editor) {
  const value = window.prompt(
    "Dán URL YouTube hoặc URL HTTPS kết thúc bằng .mp4:",
  );
  if (!value) return;

  const video = normalizeBlogVideoUrl(value);
  if (!video) {
    window.alert("URL video không hợp lệ.");
    return;
  }

  editor.chain().focus().insertContent({
    type: "blogVideo",
    attrs: {
      type: video.type,
      src: video.src,
    },
  }).run();
}

export function BlogEditor({
  initialContent,
  error,
  onChange,
}: BlogEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          defaultProtocol: "https",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      ImageExtension.configure({
        inline: false,
        allowBase64: false,
      }),
      BlogVideo,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "blog-editor-content",
        "aria-label": "Nội dung bài viết",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getHTML());
    },
  });

  async function handleImage(file: File | undefined) {
    if (!file || !editor) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const src = await uploadContentImage(file);
      editor.chain().focus().setImage({
        src,
        alt: file.name.replace(/\.[^.]+$/, ""),
      }).run();
    } catch (uploadFailure) {
      setUploadError(
        uploadFailure instanceof Error
          ? uploadFailure.message
          : "Không thể upload ảnh",
      );
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-background",
        error ? "border-destructive" : "border-input",
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-2">
        <ToolbarButton label="Tiêu đề 1" icon={Heading1} active={editor?.isActive("heading", { level: 1 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolbarButton label="Tiêu đề 2" icon={Heading2} active={editor?.isActive("heading", { level: 2 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarButton label="Tiêu đề 3" icon={Heading3} active={editor?.isActive("heading", { level: 3 })} disabled={!editor} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="In đậm" icon={Bold} active={editor?.isActive("bold")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()} />
        <ToolbarButton label="In nghiêng" icon={Italic} active={editor?.isActive("italic")} disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()} />
        <ToolbarButton label="Gạch chân" icon={Underline} active={editor?.isActive("underline")} disabled={!editor} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
        <ToolbarButton label="Gạch ngang" icon={Strikethrough} active={editor?.isActive("strike")} disabled={!editor} onClick={() => editor?.chain().focus().toggleStrike().run()} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Danh sách dấu đầu dòng" icon={List} active={editor?.isActive("bulletList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()} />
        <ToolbarButton label="Danh sách đánh số" icon={ListOrdered} active={editor?.isActive("orderedList")} disabled={!editor} onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
        <ToolbarButton label="Trích dẫn" icon={Quote} active={editor?.isActive("blockquote")} disabled={!editor} onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
        <ToolbarButton label="Đường phân cách" icon={Minus} disabled={!editor} onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Căn trái" icon={AlignLeft} active={editor?.isActive({ textAlign: "left" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
        <ToolbarButton label="Căn giữa" icon={AlignCenter} active={editor?.isActive({ textAlign: "center" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
        <ToolbarButton label="Căn phải" icon={AlignRight} active={editor?.isActive({ textAlign: "right" })} disabled={!editor} onClick={() => editor?.chain().focus().setTextAlign("right").run()} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Thêm liên kết" icon={Link2} active={editor?.isActive("link")} disabled={!editor} onClick={() => editor && setLink(editor)} />
        <ToolbarButton label={uploading ? "Đang upload ảnh" : "Thêm ảnh"} icon={ImagePlus} disabled={!editor || uploading} onClick={() => imageInputRef.current?.click()} />
        <ToolbarButton label="Thêm video" icon={Video} disabled={!editor} onClick={() => editor && insertVideo(editor)} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <ToolbarButton label="Hoàn tác" icon={Undo2} disabled={!editor?.can().chain().focus().undo().run()} onClick={() => editor?.chain().focus().undo().run()} />
        <ToolbarButton label="Làm lại" icon={Redo2} disabled={!editor?.can().chain().focus().redo().run()} onClick={() => editor?.chain().focus().redo().run()} />
        <input
          ref={imageInputRef}
          type="file"
          accept={EDITOR_IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void handleImage(event.target.files?.[0])}
        />
      </div>

      <EditorContent editor={editor} />

      {uploading ? (
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">Đang xử lý ảnh…</p>
      ) : null}
      {uploadError ? (
        <p role="alert" className="border-t border-destructive/20 px-4 py-2 text-xs text-destructive">{uploadError}</p>
      ) : null}
    </div>
  );
}
