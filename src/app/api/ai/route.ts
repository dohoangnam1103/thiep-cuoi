import type { NextRequest } from "next/server";
import { z } from "zod";

import { getSession } from "@/lib/session";

const bodySchema = z.object({
  kind: z.enum(["wish", "invitation", "thankyou"]).default("wish"),
  groomName: z.string().trim().max(120).optional().default(""),
  brideName: z.string().trim().max(120).optional().default(""),
  tone: z.enum(["formal", "warm", "playful"]).optional().default("warm"),
  prompt: z.string().trim().max(500).optional().default(""),
});

type Kind = z.infer<typeof bodySchema>["kind"];
type Tone = NonNullable<z.infer<typeof bodySchema>["tone"]>;

const RATE_LIMIT = 10;
const WINDOW_MS = 60 * 1000;
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

function coupleLabel(groom: string, bride: string): string {
  if (groom && bride) return `${groom} & ${bride}`;
  return groom || bride || "cô dâu & chú rể";
}

function stubText(kind: Kind, tone: Tone, groom: string, bride: string): string {
  const couple = coupleLabel(groom, bride);
  if (kind === "invitation") {
    return `Trân trọng kính mời bạn đến chung vui trong ngày hạnh phúc của ${couple}. Sự hiện diện của bạn là niềm vinh hạnh cho gia đình chúng tôi.`;
  }
  if (kind === "thankyou") {
    return `${couple} xin chân thành cảm ơn bạn đã đến chung vui và gửi những lời chúc tốt đẹp nhất trong ngày trọng đại của chúng tôi.`;
  }
  // wish
  const wishes: Record<Tone, string> = {
    formal: `Chúc mừng ${couple}. Kính chúc hai bạn trăm năm hạnh phúc, sắt son bền chặt và xây dựng một tổ ấm viên mãn.`,
    warm: `Chúc ${couple} một đám cưới thật ấm áp và một cuộc sống hôn nhân tràn ngập yêu thương, tiếng cười và hạnh phúc dài lâu.`,
    playful: `Chúc ${couple} về chung một nhà, cãi nhau ít thôi, yêu nhau thật nhiều và mãi mãi ngọt ngào như ngày hôm nay nhé!`,
  };
  return wishes[tone];
}

async function llmText(
  apiKey: string,
  kind: Kind,
  tone: Tone,
  groom: string,
  bride: string,
  userPrompt: string,
): Promise<string | null> {
  const couple = coupleLabel(groom, bride);
  const system =
    "Bạn là trợ lý viết lời chúc và lời mời cưới bằng tiếng Việt, ngắn gọn, chân thành, không dùng emoji.";
  const user =
    `Loại nội dung: ${kind}. Giọng văn: ${tone}. Cặp đôi: ${couple}.` +
    (userPrompt ? ` Yêu cầu thêm: ${userPrompt}` : "");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  if (rateLimited(session.userId)) {
    return Response.json({ error: "Bạn thao tác quá nhanh, vui lòng thử lại sau" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { kind, tone, groomName, brideName, prompt } = parsed.data;
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY;

  let text: string | null = null;
  let source: "llm" | "stub" = "stub";
  if (apiKey) {
    text = await llmText(apiKey, kind, tone, groomName, brideName, prompt);
    if (text) source = "llm";
  }
  if (!text) {
    text = stubText(kind, tone, groomName, brideName);
  }

  return Response.json({ text, source });
}
