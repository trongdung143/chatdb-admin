import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  fetchChatbots,
  fetchChatbot,
  fetchOverview,
  createChatbot,
  updateChatbot,
  deleteChatbot,
  updateChatbotStatus,
  type ListParams,
  type ChatbotFormData,
  type ChatbotStatus,
} from "@/lib/api";

// ── Query keys ──────────────────────────────────────────────────────────────

export const keys = {
  all: ["chatbots"] as const,
  list: (p: ListParams) => ["chatbots", "list", p] as const,
  detail: (id: string) => ["chatbots", "detail", id] as const,
  overview: ["chatbots", "overview"] as const,
};

// ── Queries ─────────────────────────────────────────────────────────────────

/** List chatbots — paginated, filtered, cached 30 s */
export function useChatbots(params: ListParams = {}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => fetchChatbots(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

/** Single chatbot detail — cached 60 s, only runs when id is set */
export function useChatbot(id: string | null) {
  return useQuery({
    queryKey: ["chatbots", "detail", id],
    queryFn: id ? () => fetchChatbot(id) : () => Promise.reject("No id"),
    enabled: !!id,
    staleTime: 60_000,
  });
}

/** Overview stats — cached 60 s, auto-refetches every 2 min */
export function useOverview() {
  return useQuery({
    queryKey: keys.overview,
    queryFn: fetchOverview,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateChatbot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ChatbotFormData) => createChatbot(body),
    onSuccess: (response) => {
      console.log("Create success, invalidating queries...", response);
      qc.invalidateQueries({ queryKey: ["chatbots"] });
    },
    onError: (error) => {
      console.error("Create error:", error);
    },
  });
}

export function useUpdateChatbot(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ChatbotFormData>) => updateChatbot(id, body),
    onSuccess: (response) => {
      console.log("Update success, invalidating queries...", response);
      qc.invalidateQueries({ queryKey: ["chatbots"] });
    },
    onError: (error) => {
      console.error("Update error:", error);
    },
  });
}

export function useDeleteChatbot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteChatbot(id),
    onSuccess: () => {
      console.log("Delete success, invalidating queries...");
      qc.invalidateQueries({ queryKey: ["chatbots"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ChatbotStatus }) =>
      updateChatbotStatus(id, status),
    onSuccess: () => {
      console.log("Status update success, invalidating queries...");
      qc.invalidateQueries({ queryKey: ["chatbots"] });
    },
    onError: (error) => {
      console.error("Status update error:", error);
    },
  });
}
