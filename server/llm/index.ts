import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionChunk,
} from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
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

const CHEAP_MODEL_BY_PROVIDER: Record<LlmProvider, LlmModel> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4",
};

export function isValidModel(value: unknown): value is LlmModel {
  return typeof value === "string" && value in MODEL_PROVIDER;
}

export function getAllowedModelsForPlan(plan: string | null | undefined): LlmModel[] {
  const list = [...(PLAN_ALLOWED_MODELS[plan || "free"] || PLAN_ALLOWED_MODELS.free)];
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

/**
 * Resolves the cheapest model in the same provider family as the tenant's
 * configured model. Used for internal/background workloads (lead scoring,
 * KB extraction) where we want to honor the tenant's provider choice but
 * minimize cost regardless of which premium model they picked for chat.
 */
export function resolveCheapModelForTenant(tenant: Pick<Tenant, "plan" | "aiModel"> | null | undefined): LlmModel {
  const chosen = resolveModelForTenant(tenant);
  const provider = MODEL_PROVIDER[chosen] || "openai";
  return CHEAP_MODEL_BY_PROVIDER[provider] || DEFAULT_MODEL;
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

interface RawChatOutput {
  content: string;
  tokensIn: number;
  tokensOut: number;
}

function computeCostMicros(model: LlmModel, tokensIn: number, tokensOut: number): number {
  const p = MODEL_PRICING_PER_MTOK_USD[model] || MODEL_PRICING_PER_MTOK_USD[DEFAULT_MODEL];
  const usd = (tokensIn * p.input + tokensOut * p.output) / 1_000_000;
  return Math.round(usd * 1_000_000);
}

function errorMessageOf(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
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
}): Promise<void> {
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
  } catch (e) {
    console.error("[llm] recordUsage failed:", errorMessageOf(e));
  }
}

async function callOpenAI(model: LlmModel, opts: ChatOpts): Promise<RawChatOutput> {
  const messages = opts.messages.map((m) => ({ role: m.role, content: m.content })) as ChatCompletionMessageParam[];
  const params: ChatCompletionCreateParamsNonStreaming = {
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

async function callAnthropic(_model: LlmModel, _opts: ChatOpts): Promise<RawChatOutput> {
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
    const { content, tokensIn, tokensOut } = provider === "anthropic"
      ? await callAnthropic(requested, opts)
      : await callOpenAI(requested, opts);
    const latencyMs = Date.now() - start;
    await recordUsage({ tenantId: opts.tenantId, model: requested, provider, kind, tokensIn, tokensOut, latencyMs, status: "ok" });
    return { content, model: requested, provider, tokensIn, tokensOut, latencyMs, fellBack: false };
  } catch (primaryErr) {
    const primaryLatency = Date.now() - start;
    const errorMessage = errorMessageOf(primaryErr);
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
    } catch (fallbackErr) {
      console.error(`[llm] fallback also failed: ${errorMessageOf(fallbackErr)}`);
      throw fallbackErr;
    }
  }
}

interface StreamOnceResult extends RawChatOutput {
  emittedAny: boolean;
}

async function streamOnceOpenAI(
  model: LlmModel,
  opts: StreamOpts,
  onChunk?: (delta: string, accumulated: string) => void,
): Promise<StreamOnceResult> {
  const messages = opts.messages.map((m) => ({ role: m.role, content: m.content })) as ChatCompletionMessageParam[];
  const params: ChatCompletionCreateParamsStreaming = {
    model,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_completion_tokens: opts.maxTokens ?? 1000,
    stream: true,
    stream_options: { include_usage: true },
  };
  const stream: Stream<ChatCompletionChunk> = await openaiClient().chat.completions.create(params);

  let accumulated = "";
  let tokensIn = 0;
  let tokensOut = 0;
  let emittedAny = false;
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      accumulated += delta;
      if (onChunk) {
        onChunk(delta, accumulated);
        emittedAny = true;
      }
    }
    if (chunk.usage) {
      tokensIn = chunk.usage.prompt_tokens || tokensIn;
      tokensOut = chunk.usage.completion_tokens || tokensOut;
    }
  }
  return { content: accumulated, tokensIn, tokensOut, emittedAny };
}

export async function chatStream(opts: StreamOpts): Promise<ChatResult> {
  const requested = opts.model || DEFAULT_MODEL;
  const requestedProvider = MODEL_PROVIDER[requested] || "openai";
  const kind = opts.kind || "chat_stream";

  // Anthropic streaming not implemented yet — fall back transparently to OpenAI
  // before even trying. This is a "pre-fallback", not a runtime failure.
  const useModel: LlmModel = requestedProvider === "anthropic" ? FALLBACK_MODEL : requested;
  const useProvider: LlmProvider = MODEL_PROVIDER[useModel];
  const fellBackBeforeCall = useModel !== requested;

  const start = Date.now();
  let primaryEmittedAny = false;
  try {
    const { content, tokensIn, tokensOut, emittedAny } = await streamOnceOpenAI(useModel, opts, opts.onChunk);
    primaryEmittedAny = emittedAny;
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
      content,
      model: useModel,
      provider: useProvider,
      tokensIn,
      tokensOut,
      latencyMs,
      fellBack: fellBackBeforeCall,
    };
  } catch (primaryErr) {
    const primaryLatency = Date.now() - start;
    const errorMessage = errorMessageOf(primaryErr);
    console.error(`[llm] stream ${useModel} failed (emittedAny=${primaryEmittedAny}): ${errorMessage}`);
    await recordUsage({
      tenantId: opts.tenantId,
      model: useModel,
      provider: useProvider,
      kind,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: primaryLatency,
      status: "error",
      errorMessage,
    });

    // Runtime fallback: only safe if (a) we have a different fallback model and
    // (b) the primary attempt did not already emit any chunks to the consumer.
    // Otherwise we'd produce mixed/duplicated streamed text.
    if (useModel === FALLBACK_MODEL || primaryEmittedAny) {
      throw primaryErr;
    }
    const fallbackStart = Date.now();
    try {
      const { content, tokensIn, tokensOut } = await streamOnceOpenAI(FALLBACK_MODEL, opts, opts.onChunk);
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
        errorMessage: `stream fallback from ${useModel}: ${errorMessage}`,
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
    } catch (fallbackErr) {
      console.error(`[llm] stream fallback also failed: ${errorMessageOf(fallbackErr)}`);
      throw fallbackErr;
    }
  }
}
