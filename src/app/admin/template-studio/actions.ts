"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { verifyAdmin } from "@/lib/admin-dal";
import {
  getResolvedAiConnection,
  normalizeAiBaseUrl,
  updateAiConnection,
} from "@/lib/ai-config";
import {
  applyLocalDesignPrompt,
  studioDecorations,
  studioHeroStyles,
  studioLayouts,
  studioPalettes,
  studioSections,
  studioSpecSchema,
  studioTypography,
  type StudioSpec,
} from "@/lib/template-studio";

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(1_000),
  current: studioSpecSchema,
});

export type GenerateStudioDesignResult =
  | { ok: true; spec: StudioSpec; mode: "ai" | "local" }
  | { ok: false; error: "invalid" | "rateLimited" };

const aiConnectionSchema = z.object({
  baseUrl: z.string().trim().min(1).max(500),
  apiKey: z.string().trim().max(2_000).refine((value) => !value || value.length >= 8).default(""),
  model: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._:/-]+$/),
  removeApiKey: z.boolean().default(false),
});

export type AiConnectionState =
  | { ok?: boolean; error?: "invalidUrl" | "invalidKey" | "invalidModel" | "saveFailed" }
  | undefined;

const RATE_LIMIT = 12;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function systemPrompt(): string {
  return [
    "Bạn là art director cho thiệp cưới online Việt Nam.",
    "Hãy chỉnh toàn bộ design spec dựa trên yêu cầu, nhưng chỉ trả về một JSON object hợp lệ, không markdown.",
    `palette: ${studioPalettes.join(", ")}.`,
    `typography: ${studioTypography.join(", ")}.`,
    `layout: ${studioLayouts.join(", ")}.`,
    `decoration: ${studioDecorations.join(", ")}.`,
    `heroStyle: ${studioHeroStyles.join(", ")}.`,
    `sectionOrder chỉ dùng: ${studioSections.join(", ")}; không lặp; giữ ít nhất 3 mục.`,
    "Giữ nguyên version=1 và sourceSlug. copy gồm eyebrow tối đa 80 ký tự, quote và closing tối đa 240 ký tự.",
    "Không trả về JSX, CSS, URL, giải thích hoặc thuộc tính ngoài schema.",
  ].join(" ");
}

async function generateWithModel(
  apiKey: string,
  baseUrl: string,
  model: string,
  prompt: string,
  current: StudioSpec,
): Promise<StudioSpec | null> {
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt() },
          {
            role: "user",
            content: `Design spec hiện tại: ${JSON.stringify(current)}\nYêu cầu chỉnh sửa: ${prompt}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 1_200,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = payload.choices?.[0]?.message?.content?.trim();
    if (!text) return null;

    const decoded: unknown = JSON.parse(text);
    const candidate = isRecord(decoded) && isRecord(decoded.spec) ? decoded.spec : decoded;
    if (!isRecord(candidate)) return null;

    const parsed = studioSpecSchema.safeParse({
      ...candidate,
      version: 1,
      sourceSlug: current.sourceSlug,
    });
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function generateStudioDesign(input: unknown): Promise<GenerateStudioDesignResult> {
  const { adminId } = await verifyAdmin();
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (rateLimited(adminId)) return { ok: false, error: "rateLimited" };

  const { prompt, current } = parsed.data;
  const connection = await getResolvedAiConnection();
  if (connection.apiKey) {
    const generated = await generateWithModel(
      connection.apiKey,
      connection.baseUrl,
      connection.model,
      prompt,
      current,
    );
    if (generated) return { ok: true, spec: generated, mode: "ai" };
  }

  return {
    ok: true,
    spec: applyLocalDesignPrompt(prompt, current),
    mode: "local",
  };
}

export async function updateAiConnectionAction(
  _prev: AiConnectionState,
  formData: FormData,
): Promise<AiConnectionState> {
  await verifyAdmin();

  const parsed = aiConnectionSchema.safeParse({
    baseUrl: formData.get("baseUrl"),
    apiKey: formData.get("apiKey") ?? "",
    model: formData.get("model"),
    removeApiKey: formData.get("removeApiKey") === "on",
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "baseUrl") return { error: "invalidUrl" };
    if (field === "apiKey") return { error: "invalidKey" };
    if (field === "model") return { error: "invalidModel" };
    return { error: "saveFailed" };
  }

  const baseUrl = normalizeAiBaseUrl(parsed.data.baseUrl);
  if (!baseUrl) return { error: "invalidUrl" };

  try {
    await updateAiConnection({ ...parsed.data, baseUrl });
    revalidatePath("/admin/template-studio");
    return { ok: true };
  } catch {
    return { error: "saveFailed" };
  }
}