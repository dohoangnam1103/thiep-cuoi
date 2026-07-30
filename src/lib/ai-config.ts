import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const APP_CONFIG_ID = "default";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4o-mini";

type StoredAiConfig = {
  aiBaseUrl: string | null;
  aiApiKeyEncrypted: string | null;
  aiModel: string | null;
};

export type AiConnectionStatus = {
  baseUrl: string;
  model: string;
  configured: boolean;
  hasStoredApiKey: boolean;
  keySource: "database" | "environment" | "none";
};

export type ResolvedAiConnection = AiConnectionStatus & {
  apiKey: string | null;
};

export type AiConnectionUpdate = {
  baseUrl: string;
  model: string;
  apiKey: string;
  removeApiKey: boolean;
};

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHash("sha256").update(`template-studio-ai:${secret}`).digest();
}

function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), authTag.toString("base64url"), encrypted.toString("base64url")].join(":");
}

function decryptSecret(envelope: string | null): string | null {
  if (!envelope) return null;
  try {
    const [version, ivValue, authTagValue, encryptedValue, extra] = envelope.split(":");
    if (version !== "v1" || !ivValue || !authTagValue || !encryptedValue || extra) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function normalizeAiBaseUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const localDevelopmentUrl =
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !localDevelopmentUrl) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

async function getStoredAiConfig(): Promise<StoredAiConfig | null> {
  return prisma.appConfig.findUnique({
    where: { id: APP_CONFIG_ID },
    select: {
      aiBaseUrl: true,
      aiApiKeyEncrypted: true,
      aiModel: true,
    },
  });
}

export async function getResolvedAiConnection(): Promise<ResolvedAiConnection> {
  const stored = await getStoredAiConfig();
  const storedApiKey = decryptSecret(stored?.aiApiKeyEncrypted ?? null);
  const environmentApiKey = (process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY)?.trim() || null;
  const apiKey = storedApiKey || environmentApiKey;
  const configuredBaseUrl = stored?.aiBaseUrl || process.env.AI_BASE_URL || DEFAULT_BASE_URL;
  const baseUrl = normalizeAiBaseUrl(configuredBaseUrl) ?? DEFAULT_BASE_URL;
  const model = stored?.aiModel?.trim() || process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

  return {
    apiKey,
    baseUrl,
    model,
    configured: Boolean(apiKey),
    hasStoredApiKey: Boolean(stored?.aiApiKeyEncrypted),
    keySource: storedApiKey ? "database" : environmentApiKey ? "environment" : "none",
  };
}

export async function getAiConnectionStatus(): Promise<AiConnectionStatus> {
  const resolved = await getResolvedAiConnection();
  return {
    baseUrl: resolved.baseUrl,
    model: resolved.model,
    configured: resolved.configured,
    hasStoredApiKey: resolved.hasStoredApiKey,
    keySource: resolved.keySource,
  };
}

export async function updateAiConnection({
  baseUrl,
  model,
  apiKey,
  removeApiKey,
}: AiConnectionUpdate): Promise<void> {
  const normalizedBaseUrl = normalizeAiBaseUrl(baseUrl);
  if (!normalizedBaseUrl) throw new Error("Invalid AI base URL");

  const keyUpdate = apiKey
    ? { aiApiKeyEncrypted: encryptSecret(apiKey) }
    : removeApiKey
      ? { aiApiKeyEncrypted: null }
      : {};
  const data = {
    aiBaseUrl: normalizedBaseUrl,
    aiModel: model.trim(),
    ...keyUpdate,
  };

  await prisma.appConfig.upsert({
    where: { id: APP_CONFIG_ID },
    create: { id: APP_CONFIG_ID, ...data },
    update: data,
  });
}