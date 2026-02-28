import { createRequire } from "module";
const require = createRequire(import.meta.url);
const FlowApi = require("flowcl-node-api-client");

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
