import sanitizeHtml from "sanitize-html";

import { normalizeBlogVideoUrl } from "@/lib/blog-video";

const BLOG_MEDIA_URL = /^\/blog-media\/[0-9a-f-]{36}\.webp$/;

function removedTag(): sanitizeHtml.Tag {
  return { tagName: "span", attribs: {} };
}

function safeImageUrl(value: string): string | null {
  const trimmed = value.trim();
  return BLOG_MEDIA_URL.test(trimmed) ? trimmed : null;
}

export function sanitizeBlogHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: [
      "p",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "hr",
      "br",
      "img",
      "iframe",
      "video",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
      iframe: [
        "src",
        "title",
        "allow",
        "allowfullscreen",
        "loading",
        "referrerpolicy",
        "data-blog-video",
      ],
      video: ["src", "controls", "preload", "data-blog-video"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["https"],
      iframe: ["https"],
      video: ["https"],
    },
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        "text-align": [/^(?:left|center|right)$/],
      },
    },
    transformTags: {
      a: (_tagName, attributes) => {
        const href = attributes.href?.trim() ?? "";
        const external = /^https?:\/\//i.test(href);
        return {
          tagName: "a",
          attribs: {
            ...(href ? { href } : {}),
            ...(attributes.title ? { title: attributes.title } : {}),
            ...(external
              ? { target: "_blank", rel: "nofollow noopener noreferrer" }
              : {}),
          },
        };
      },
      img: (_tagName, attributes): sanitizeHtml.Tag => {
        const src = safeImageUrl(attributes.src ?? "");
        return src
          ? {
              tagName: "img",
              attribs: {
                src,
                ...(attributes.alt ? { alt: attributes.alt } : { alt: "" }),
                ...(attributes.title ? { title: attributes.title } : {}),
              },
            }
          : removedTag();
      },
      iframe: (_tagName, attributes): sanitizeHtml.Tag => {
        const video = normalizeBlogVideoUrl(attributes.src ?? "");
        if (!video || video.type !== "youtube") {
          return removedTag();
        }
        return {
          tagName: "iframe",
          attribs: {
            src: video.src,
            title: attributes.title || "YouTube video",
            loading: "lazy",
            referrerpolicy: "strict-origin-when-cross-origin",
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
            allowfullscreen: "",
            "data-blog-video": "youtube",
          },
        };
      },
      video: (_tagName, attributes): sanitizeHtml.Tag => {
        const video = normalizeBlogVideoUrl(attributes.src ?? "");
        if (!video || video.type !== "mp4") {
          return removedTag();
        }
        return {
          tagName: "video",
          attribs: {
            src: video.src,
            controls: "",
            preload: "metadata",
            "data-blog-video": "mp4",
          },
        };
      },
    },
  }).trim();
}

export function hasMeaningfulBlogContent(value: string): boolean {
  const text = sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).replace(/\u00a0/g, " ").trim();

  return text.length > 0 || /<(?:img|iframe|video)\b/i.test(value);
}
