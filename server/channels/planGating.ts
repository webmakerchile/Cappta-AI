export type ChannelSlug =
  | "whatsapp"
  | "whatsapp_cloud"
  | "instagram"
  | "messenger"
  | "telegram"
  | "email";

const PLAN_RANK: Record<string, number> = {
  free: 0,
  solo: 1,
  basic: 2,
  scale: 3,
  pro: 3,
  enterprise: 4,
};

const CHANNEL_MIN_PLAN: Record<ChannelSlug, { plan: string; label: string }> = {
  email: { plan: "solo", label: "Cappta Solo" },
  whatsapp: { plan: "basic", label: "Cappta Pro" },
  instagram: { plan: "scale", label: "Cappta Scale" },
  messenger: { plan: "scale", label: "Cappta Scale" },
  telegram: { plan: "scale", label: "Cappta Scale" },
  whatsapp_cloud: { plan: "enterprise", label: "Cappta Enterprise" },
};

export function getChannelMinPlan(channel: ChannelSlug): { plan: string; label: string } {
  return CHANNEL_MIN_PLAN[channel];
}

export function planRank(plan: string | null | undefined): number {
  if (!plan) return 0;
  return PLAN_RANK[plan] ?? 0;
}

export function tenantCanUseChannel(plan: string | null | undefined, channel: ChannelSlug): boolean {
  const min = CHANNEL_MIN_PLAN[channel];
  if (!min) return false;
  return planRank(plan) >= planRank(min.plan);
}
