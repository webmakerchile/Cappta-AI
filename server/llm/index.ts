import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { storage } from "../storage";
import type { Tenant } from "@shared/schema";

export type LlmRole = "system" | "user" | "assistant";
export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export type LlmModel =
  | "gpt-4o-mini"
  | "gpt-4o"
  | "claude-haiku-4"
  | "claude-sonnet-4-5";

export type LlmProvider = "openai" | "anthropic";

export const DEFAULT_MODEL: LlmModel = "gpt-4o-mini";
export const FALLBACK_MODEL: LlmModel = "gpt-4o-mini";

export const MODEL_PROVIDER: Record<LlmModel, LlmProvider> = {
  "gpt-4o-mini": "openai",
  "gpt-4o": "openai",
  "claude-haiku-4": "anthropic",
  "claude-sonnet-4-5": "anthropic",
};

export const MODEL_PRICING_PER_MTOK_USD: Record<LlmModel, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4o": { input: 2.50, output: 10.00 },
  "claude-haiku-4": { input: 1.00, output: 5.00 },
  "claude-sonnet-4-5": { input: 3.00, output: 15.00 },
};

// GPT-only por ahora. Anthropic queda como stub futuro y se habilita
// explícitamente con LLM_ENABLE_ANTHROPIC=1 + ANTHROPIC_API_KEY.
export const PLAN_ALLOWED_MODELS: Record<string, LlmModel[]> = {
  free: ["gpt-4o-mini"],
  solo: ["gpt-4o-mini"],
  basic: ["gpt-4o-mini"],
  scale: ["gpt-4o-mini", "gpt-4o"],
  pro: ["gpt-4o-mini", "gpt-4o"],
  enterprise: ["gpt-4o-mini", "gpt-4o"],
};

const ANTHROPIC_PRO_MODELS: LlmModel[] = ["claude-haiku-4", "claude-sonnet-4-5"];

export const MODEL_LABELS: Record<LlmModel, string> = {
  "gpt-4o-mini": "GPT-4o mini (rápido, económico)",
  "gpt-4o": "GPT-4o (premium, más preciso)",
  "claude-haiku-4": "Claude Haiku 4 (próximamente)",
  "claude-sonnet-4-5": "Claude Sonnet 4.5 (próximamente)",
};

export function isValidModel(value: unknown): value is LlmModel {
  return typeof value === "string" && value in MODEL_PROVIDER;
}

export function getAllowedModelsForPlan(plan: string | null | undefined): LlmModel[] {
  const list = [...(PLAN_ALLOWED_MODELS[plan || "free"] || PLAN_ALLOWED_MODELS.free)];
  // Anthropic queda detrás de un feature flag explícito + API key
  const anthropicEnabled = process.env.LLM_ENABLE_ANTHROPIC === "1" && !!process.env.ANTHROPIC_API_KEY;
  if (anthropicEnabled && (plan === "pro" || plan === "enterprise")) {
    return [...list, ...ANTHROPIC_PRO_MODELS];
  }
  return list;
}

export function resolveModelForTenant(tenant: Pick<Tenant, "plan" | "aiModel"> | null | undefined): LlmModel {
  const plan = tenant?.plan || "free";
  const requested = (tenant?.aiModel as LlmModel | undefined) || DEFAULT_MODEL;
  const allowed = getAllowedModelsForPlan(plan);
  if (allowed.includes(requested)) return requested;
  return allowed[0] || DEFAULT_MODEL;
}

let _openai: OpenAI | null = null;
function openaiClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

interface ChatOpts {
  tenantId?: number | null;
  model?: LlmModel;
  messages: LlmMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json_object" | "text";
  kind?: string;
}

export interface ChatResult {
  content: string;
  model: LlmModel;
  provider: LlmProvider;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  fellBack: boolean;
}

interface StreamOpts extends ChatOpts {
  onChunk?: (delta: string, accumulated: string) => void;
}

function computeCostMicros(model: LlmModel, tokensIn: number, tokensOut: number): number {
  const p = MODEL_PRICING_PER_MTOK_USD[model] || MODEL_PRICING_PER_MTOK_USD[DEFAULT_MODEL];
  const usd = (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
  return Math.round(usd * 1_000_000);
}

async function recordUsage(params: {
  tenantId?: number | null;
  model: LlmModel;
  provider: LlmProvider;
  kind: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  status: "ok" | "fallback" | "error";
  errorMessage?: string | null;
}) {
  try {
    await storage.recordLlmUsage({
      tenantId: params.tenantId ?? null,
      provider: params.provider,
      model: params.model,
      kind: params.kind,
      tokensIn: params.tokensIn,
      tokensOut: params.tokensOut,
      costUsdMicros: computeCostMicros(params.model, params.tokensIn, params.tokensOut),
      latencyMs: params.latencyMs,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
    });
  } catch (e: any) {
    console.error("[llm] recordUsage failed:", e?.message);
  }
}

async function callOpenAI(model: LlmModel, opts: ChatOpts): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const messages = opts.messages.map((m) => ({ role: m.role, content: m.content })) as ChatCompletionMessageParam[];
  const params: any = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_completion_tokens: opts.maxTokens ?? 1000,
  };
  if (opts.responseFormat === "json_object") {
    params.response_format = { type: "json_object" };
  }
  const resp = await openaiClient().chat.completions.create(params);
  const content = resp.choices[0]?.message?.content || "";
  const tokensIn = resp.usage?.prompt_tokens || 0;
  const tokensOut = resp.usage?.completion_tokens || 0;
  return { content, tokensIn, tokensOut };
}

async function callAnthropic(_model: LlmModel, _opts: ChatOpts): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  // Anthropic provider stub. When ANTHROPIC_API_KEY is wired and @anthropic-ai/sdk
  // is installed, this is the only place that needs to change. For now we throw
  // so the abstraction falls back to OpenAI cleanly.
  throw new Error("Anthropic provider not configured");
}

export async function chat(opts: ChatOpts): Promise<ChatResult> {
  const requested = opts.model || DEFAULT_MODEL;
  const provider = MODEL_PROVIDER[requested] || "openai";
  const kind = opts.kind || "chat";

  const start = Date.now();
  try {
    if (provider === "anthropic") {
      const { content, tokensIn, tokensOut } = await callAnthropic(requested, opts);
      const latencyMs = Date.now() - start;
      await recordUsage({ tenantId: opts.tenantId, model: requested, provider, kind, tokensIn, tokensOut, latencyMs, status: "ok" });
      return { content, model: requested, provider, tokensIn, tokensOut, latencyMs, fellBack: false };
    }
    const { content, tokensIn, tokensOut } = await callOpenAI(requested, opts);
    const latencyMs = Date.now() - start;
    await recordUsage({ tenantId: opts.tenantId, model: requested, provider, kind, tokensIn, tokensOut, latencyMs, status: "ok" });
    return { content, model: requested, provider, tokensIn, tokensOut, latencyMs, fellBack: false };
  } catch (primaryErr: any) {
    const primaryLatency = Date.now() - start;
    const errorMessage = primaryErr?.message || String(primaryErr);
    console.error(`[llm] primary ${requested} failed: ${errorMessage}`);
    await recordUsage({
      tenantId: opts.tenantId,
      model: requested,
      provider,
      kind,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: primaryLatency,
      status: "error",
      errorMessage,
    });

    if (requested === FALLBACK_MODEL) {
      throw primaryErr;
    }
    const fallbackStart = Date.now();
    try {
      const { content, tokensIn, tokensOut } = await callOpenAI(FALLBACK_MODEL, opts);
      const latencyMs = Date.now() - fallbackStart;
      await recordUsage({
        tenantId: opts.tenantId,
        model: FALLBACK_MODEL,
        provider: MODEL_PROVIDER[FALLBACK_MODEL],
        kind,
        tokensIn,
        tokensOut,
        latencyMs,
        status: "fallback",
        errorMessage: `fallback from ${requested}: ${errorMessage}`,
      });
      return {
        content,
        model: FALLBACK_MODEL,
        provider: MODEL_PROVIDER[FALLBACK_MODEL],
        tokensIn,
        tokensOut,
        latencyMs,
        fellBack: true,
      };
    } catch (fallbackErr: any) {
      console.error(`[llm] fallback also failed: ${fallbackErr?.message}`);
      throw fallbackErr;
    }
  }
}

export async function chatStream(opts: StreamOpts): Promise<ChatResult> {
  const requested = opts.model || DEFAULT_MODEL;
  const provider = MODEL_PROVIDER[requested] || "openai";
  const kind = opts.kind || "chat_stream";
  const start = Date.now();

  // Anthropic streaming not implemented yet — fall back transparently to OpenAI.
  const useModel: LlmModel = provider === "anthropic" ? FALLBACK_MODEL : requested;
  const useProvider: LlmProvider = MODEL_PROVIDER[useModel];
  const fellBackBeforeCall = useModel !== requested;

  const messages = opts.messages.map((m) => ({ role: m.role, content: m.content })) as ChatCompletionMessageParam[];
  try {
    const stream = await openaiClient().chat.completions.create({
      model: useModel,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_completion_tokens: opts.maxTokens ?? 1000,
      stream: true,
      stream_options: { include_usage: true },
    } as any);

    let accumulated = "";
    let tokensIn = 0;
    let tokensOut = 0;
    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        accumulated += delta;
        if (opts.onChunk) opts.onChunk(delta, accumulated);
      }
      if (chunk.usage) {
        tokensIn = chunk.usage.prompt_tokens || tokensIn;
        tokensOut = chunk.usage.completion_tokens || tokensOut;
      }
    }
    const latencyMs = Date.now() - start;
    await recordUsage({
      tenantId: opts.tenantId,
      model: useModel,
      provider: useProvider,
      kind,
      tokensIn,
      tokensOut,
      latencyMs,
      status: fellBackBeforeCall ? "fallback" : "ok",
      errorMessage: fellBackBeforeCall ? `anthropic streaming not configured; used ${useModel}` : null,
    });
    return {
      content: accumulated,
      model: useModel,
      provider: useProvider,
      tokensIn,
      tokensOut,
      latencyMs,
      fellBack: fellBackBeforeCall,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    await recordUsage({
      tenantId: opts.tenantId,
      model: useModel,
      provider: useProvider,
      kind,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs,
      status: "error",
      errorMessage: err?.message || String(err),
    });
    throw err;
  }
}
