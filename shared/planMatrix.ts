// Single source of truth for plan tier ranking and channel-by-tier gating.
// Used by both server (server/routes.ts gating) and client
// (client/src/pages/Dashboard.tsx CanalesSection locked-card UI) to keep
// behavior in sync. Mirrors PLAN_TIERS in server/flow.ts.

export type ChannelSlug =
  | "whatsapp"
  | "whatsapp_cloud"
  | "instagram"
  | "messenger"
  | "telegram"
  | "email";

export type PlanSlug = "free" | "solo" | "basic" | "scale" | "pro" | "enterprise";

// "basic" is internally the slug for the customer-facing "Cappta Pro" tier.
// Legacy "pro" slug maps to the same rank as "scale" (it predates the 5-tier
// rename and represents former Scale-equivalent customers).
export const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  solo: 1,
  basic: 2,
  scale: 3,
  pro: 3,
  enterprise: 4,
};

export const CHANNEL_MIN_PLAN: Record<ChannelSlug, { plan: PlanSlug; label: string }> = {
  email: { plan: "solo", label: "Cappta Solo" },
  whatsapp: { plan: "basic", label: "Cappta Pro" },
  instagram: { plan: "scale", label: "Cappta Scale" },
  messenger: { plan: "scale", label: "Cappta Scale" },
  telegram: { plan: "scale", label: "Cappta Scale" },
  whatsapp_cloud: { plan: "enterprise", label: "Cappta Enterprise" },
};

export const ALLOWED_CHANNELS: ChannelSlug[] = [
  "whatsapp",
  "whatsapp_cloud",
  "instagram",
  "messenger",
  "telegram",
  "email",
];

export function isChannelSlug(value: string): value is ChannelSlug {
  return (ALLOWED_CHANNELS as string[]).includes(value);
}

export function planRank(plan: string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_RANK[plan as PlanSlug] ?? 0;
}

export function getChannelMinPlan(channel: ChannelSlug): { plan: PlanSlug; label: string } {
  return CHANNEL_MIN_PLAN[channel];
}

export function tenantCanUseChannel(
  plan: string | null | undefined,
  channel: ChannelSlug,
): boolean {
  const min = CHANNEL_MIN_PLAN[channel];
  if (!min) return false;
  return planRank(plan) >= planRank(min.plan);
}
