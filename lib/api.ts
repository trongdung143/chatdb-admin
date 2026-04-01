import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/admin/v1/api`,
  headers: { "Content-Type": "application/json" },
});

// ── Types ──────────────────────────────────────────────────────────────────

export type ChatbotStatus = "Active" | "Pending" | "Disabled";

export interface Chatbot {
  id: string;
  name: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  description: string | null;
  status: ChatbotStatus;
  prompts: Record<string, string>;
  structure_schema: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ModelUsage {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  reasoning_tokens: number;
  cache_read_tokens: number;
  updated_at: string | null;
}

export interface ChatbotStats {
  total_messages: number;
  actual_cost: number;
  scaled_cost: number;
  avg_response_time: number;
  error_count: number;
}

export interface ChatbotDetail extends Chatbot {
  usage: ModelUsage[];
  stats: ChatbotStats;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ListParams {
  status?: ChatbotStatus | "";
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChatbotFormData {
  name: string;
  email: string;
  logo_url?: string | null;
  primary_color?: string;
  status?: ChatbotStatus;
  description?: string | null;
  prompts?: Record<string, string>;
  structure_schema?: string;
}

export interface OverviewData {
  chatbots: {
    total: number;
    active: number;
    pending: number;
    disabled: number;
  };
  last_30_days: {
    total_messages: number;
    total_actual_cost: number;
    total_scaled_cost: number;
    total_errors: number;
  };
}

// ── API calls ──────────────────────────────────────────────────────────────

function ok<T>(data: { success: boolean; message?: string } & T): T {
  if (!data.success) throw new Error(data.message ?? "Unknown error");
  return data;
}

export async function fetchChatbots(params: ListParams = {}) {
  const { data } = await api.get<{
    success: boolean;
    data: Chatbot[];
    pagination: Pagination;
  }>("/chatbots", { params });
  ok(data);
  return { data: data.data, pagination: data.pagination };
}

export async function fetchChatbot(id: string) {
  const { data } = await api.get<{ success: boolean; data: ChatbotDetail }>(
    `/chatbots/${id}`
  );
  ok(data);
  return data.data;
}

export async function createChatbot(body: ChatbotFormData) {
  const { data } = await api.post<{ success: boolean; message?: string }>(
    "/chatbots",
    body
  );
  ok(data);
  return data;
}

export async function updateChatbot(id: string, body: Partial<ChatbotFormData>) {
  const { data } = await api.patch<{ success: boolean; message?: string }>(
    `/chatbots/${id}`,
    body
  );
  ok(data);
  return data;
}

export async function updateChatbotPrompts(id: string, prompts: Record<string, string>) {
  const { data } = await api.patch<{ success: boolean; message?: string }>(
    `/chatbots/${id}/prompts`,
    { prompts }
  );
  ok(data);
  return data;
}

export async function deleteChatbot(id: string) {
  const { data } = await api.delete<{ success: boolean; message?: string }>(
    `/chatbots/${id}`
  );
  ok(data);
  return data;
}

export async function updateChatbotStatus(id: string, status: ChatbotStatus) {
  const { data } = await api.patch<{ success: boolean; message?: string }>(
    `/chatbots/${id}/status`,
    { status }
  );
  ok(data);
  return data;
}

export async function fetchOverview() {
  const { data } = await api.get<{ success: boolean; data: OverviewData }>(
    "/stats/overview"
  );
  ok(data);
  return data.data;
}