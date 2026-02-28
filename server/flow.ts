// @ts-ignore - flowcl-node-api-client is a CJS module
import FlowApi from "flowcl-node-api-client";

const FLOW_API_KEY = process.env.FLOW_API_KEY || "";
const FLOW_SECRET_KEY = process.env.FLOW_SECRET_KEY || "";
const IS_SANDBOX = FLOW_API_KEY.length < 50;

const config = {
  apiKey: FLOW_API_KEY,
  secretKey: FLOW_SECRET_KEY,
  apiURL: IS_SANDBOX ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api",
};

export function getFlowApi(baseURL: string) {
  return new FlowApi({ ...config, baseURL });
}

export const PLAN_LIMITS: Record<string, { maxSessions: number; maxMessages: number; maxAgents: number }> = {
  free: { maxSessions: 10, maxMessages: 100, maxAgents: 1 },
  basic: { maxSessions: 500, maxMessages: 5000, maxAgents: 3 },
  pro: { maxSessions: Infinity, maxMessages: Infinity, maxAgents: 10 },
};

export const PLAN_PRICES: Record<string, { amount: number; label: string; subject: string }> = {
  basic: {
    amount: 19990,
    label: "Pro",
    subject: "FoxBot Plan Pro - Suscripción Mensual",
  },
  pro: {
    amount: 49990,
    label: "Enterprise",
    subject: "FoxBot Plan Enterprise - Suscripción Mensual",
  },
};
