"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/app/language-context";
import {
  useChatbots,
  useChatbot,
  useOverview,
  useCreateChatbot,
  useUpdateChatbot,
  useUpdateChatbotPrompts,
  useDeleteChatbot,
  useUpdateStatus,
} from "@/hooks/useChatbots";
import type {
  Chatbot,
  ChatbotStatus,
  ChatbotFormData,
  ListParams,
} from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

const VND_RATE = 27_000;

const fmt = (n?: number | null) =>
  (n ?? 0).toLocaleString("vi-VN", { maximumFractionDigits: 6 });

const fmtVnd = (usd?: number | null) =>
  `${Math.round((usd ?? 0) * VND_RATE).toLocaleString("vi-VN")} ₫`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleString("vi-VN") : "—";

const STATUSES: ChatbotStatus[] = ["Active", "Pending", "Disabled"];

const STATUS_CLS: Record<ChatbotStatus, string> = {
  Active: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  Pending: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  Disabled: "border-rose-500/40 bg-rose-500/10 text-rose-400",
};

const BLANK: ChatbotFormData = {
  name: "",
  email: "",
  logo_url: "",
  primary_color: "#6c63ff",
  status: "Pending",
  description: "",
  prompts: {},
  structure_schema: "",
};

// ──────────────────────────────────────────────
// Avatar
// ──────────────────────────────────────────────

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
      style={{ background: color }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

// ──────────────────────────────────────────────
// Overview Cards
// ──────────────────────────────────────────────

function OverviewCards() {
  const { t } = useLanguage();
  const { data, isLoading } = useOverview();

  if (isLoading)
    return (
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );

  if (!data) return null;

  const cards = [
    {
      label: t("activeChatbots"),
      value: fmt(data.chatbots.active),
      sub: `${fmt(data.chatbots.total)} total`,
      accent: "before:bg-emerald-400",
      valCls: "text-emerald-400",
    },
    {
      label: t("pendingChatbots"),
      value: fmt(data.chatbots.pending),
      sub: t("pendingApproval"),
      accent: "before:bg-amber-400",
      valCls: "text-amber-400",
    },
    {
      label: t("messagesThisMonth"),
      value: fmt(data.last_30_days.total_messages),
      sub: `${fmt(data.last_30_days.total_errors)} errors`,
      accent: "before:bg-indigo-400",
      valCls: "text-indigo-400",
    },
    {
      label: t("costThisMonth"),
      value: fmtVnd(data.last_30_days.total_actual_cost),
      sub: `Converted: ${fmtVnd(data.last_30_days.total_scaled_cost)}`,
      accent: "before:bg-rose-400",
      valCls: "text-rose-400",
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5
            before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${c.accent}`}
        >
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {c.label}
          </p>
          <p className={`text-2xl font-black leading-none ${c.valCls}`}>{c.value}</p>
          <p className="mt-1.5 font-mono text-xs text-muted-foreground">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Prompts Editor
// ──────────────────────────────────────────────

type PromptEntry = { key: string; value: string };

function toEntries(obj: Record<string, string>): PromptEntry[] {
  return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

function fromEntries(entries: PromptEntry[]): Record<string, string> {
  return Object.fromEntries(entries.map(({ key, value }) => [key, value]));
}

interface PromptsEditorProps {
  prompts: Record<string, string>;
  onChange: (prompts: Record<string, string>) => void;
}

function PromptsEditor({ prompts, onChange }: PromptsEditorProps) {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<PromptEntry[]>(() => toEntries(prompts));

  // Sync when parent resets prompts (e.g. dialog open)
  useEffect(() => {
    setEntries(toEntries(prompts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(prompts)]);

  function update(index: number, field: "key" | "value", val: string) {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: val } : e));
    setEntries(next);
    onChange(fromEntries(next));
  }

  function addRow() {
    const next = [...entries, { key: "", value: "" }];
    setEntries(next);
    onChange(fromEntries(next));
  }

  function removeRow(index: number) {
    const next = entries.filter((_, i) => i !== index);
    setEntries(next);
    onChange(fromEntries(next));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{t("promptsDescription")}</p>

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-8 text-center text-sm text-muted-foreground">
          {t("noPrompts")}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <div key={i} className="group rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              {/* Key row */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {t("promptKey")}
                  </Label>
                  <Input
                    value={entry.key}
                    onChange={(e) => update(i, "key", e.target.value)}
                    placeholder={t("promptKeyPlaceholder")}
                    className="font-mono text-sm h-8"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-5 h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeRow(i)}
                >
                  ✕
                </Button>
              </div>
              {/* Value row */}
              <div>
                <Label className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {t("promptValue")}
                </Label>
                <Textarea
                  rows={3}
                  value={entry.value}
                  onChange={(e) => update(i, "value", e.target.value)}
                  placeholder={t("promptValuePlaceholder")}
                  className="resize-y text-sm font-mono leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
        onClick={addRow}
      >
        {t("addPrompt")}
      </Button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Form Dialog
// ──────────────────────────────────────────────

type FormTab = "general" | "prompts" | "schema";

interface FormDialogProps {
  open: boolean;
  editingId: string | null;
  editingBot: Chatbot | undefined;
  onClose: () => void;
  onSaveComplete?: () => void;
}

function FormDialog({ open, editingId, editingBot, onClose, onSaveComplete }: FormDialogProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState<ChatbotFormData>(BLANK);
  const [activeTab, setActiveTab] = useState<FormTab>("general");

  // Sync form when editingBot arrives (from list)
  useEffect(() => {
    if (editingBot) {
      setForm({
        name: editingBot.name,
        email: editingBot.email,
        logo_url: editingBot.logo_url ?? "",
        primary_color: editingBot.primary_color,
        status: editingBot.status,
        description: editingBot.description ?? "",
        prompts: editingBot.prompts ?? {},
        structure_schema: editingBot.structure_schema ?? "",
      });
    } else if (!editingId) {
      setForm(BLANK);
    }
  }, [editingId, editingBot]);

  // Reset tab when dialog opens
  useEffect(() => {
    if (open) setActiveTab("general");
  }, [open]);

  const createMut = useCreateChatbot();
  const updateMut = useUpdateChatbot(editingId ?? "");
  const promptsMut = useUpdateChatbotPrompts(editingId ?? "");
  const isPending = createMut.isPending || updateMut.isPending || promptsMut.isPending;

  const set = (k: keyof ChatbotFormData, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    // Validate prompt keys — no empty keys
    const entries = Object.entries(form.prompts ?? {});
    const hasEmptyKey = entries.some(([k]) => !k.trim());
    if (hasEmptyKey) {
      setActiveTab("prompts");
      toast.error(t("promptKeyRequired"));
      return;
    }
    const keys = entries.map(([k]) => k.trim());
    if (new Set(keys).size !== keys.length) {
      setActiveTab("prompts");
      toast.error(t("promptKeyDuplicate"));
      return;
    }

    const body = {
      ...form,
      logo_url: form.logo_url?.trim() || null,
      description: form.description?.trim() || null,
      prompts: form.prompts ?? {},
    };

    try {
      if (editingId) {
        await updateMut.mutateAsync(body);
        toast.success(t("updateSuccess"));
      } else {
        await createMut.mutateAsync(body);
        toast.success(t("createSuccess"));
      }
      onSaveComplete?.();
      onClose();
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  const TAB_CLS = (tab: FormTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
      ? "border-violet-500 text-violet-400"
      : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  const promptCount = Object.keys(form.prompts ?? {}).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingId ? t("editChatbot") : t("createNewChatbot")}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border -mx-1 mb-1">
          <button className={TAB_CLS("general")} onClick={() => setActiveTab("general")}>
            {t("generalTab")}
          </button>
          <button className={TAB_CLS("prompts")} onClick={() => setActiveTab("prompts")}>
            {t("promptsTab")}
            {promptCount > 0 && (
              <span className="ml-2 rounded-full bg-violet-500/20 px-1.5 py-0.5 font-mono text-[10px] text-violet-400">
                {promptCount}
              </span>
            )}
          </button>
          <button className={TAB_CLS("schema")} onClick={() => setActiveTab("schema")}>
            {t("schemaTab")}
            {(form.structure_schema ?? "").trim().length > 0 && (
              <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400" />
            )}
          </button>
        </div>

        {/* General tab */}
        {activeTab === "general" && (
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label>{t("nameLabel")}</Label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Acme Corp"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("emailLabel")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="grid gap-1.5">
              <Label>{t("logoUrlLabel")}</Label>
              <Input
                value={form.logo_url ?? ""}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>{t("primaryColorLabel")}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-1"
                  />
                  <Input
                    className="font-mono text-sm"
                    value={form.primary_color}
                    onChange={(e) => set("primary_color", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>{t("statusLabel")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => set("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>{t("descriptionLabel")}</Label>
              <Textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
          </div>
        )}

        {/* Prompts tab */}
        {activeTab === "prompts" && (
          <div className="max-h-[420px] overflow-y-auto py-1 pr-1">
            <PromptsEditor
              prompts={form.prompts ?? {}}
              onChange={(p) => setForm((f) => ({ ...f, prompts: p }))}
            />
          </div>
        )}

        {/* Schema tab */}
        {activeTab === "schema" && (
          <div className="py-1 space-y-2">
            <p className="text-xs text-muted-foreground">{t("structureSchemaDescription")}</p>
            <Textarea
              rows={14}
              value={form.structure_schema ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, structure_schema: e.target.value }))}
              placeholder={t("structureSchemaPlaceholder")}
              className="resize-y font-mono text-sm leading-relaxed"
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button disabled={isPending || (!!editingId && !editingBot)} onClick={handleSave}>
            {isPending ? t("savingDots") : editingId ? t("saveChanges") : t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Detail Dialog
// ──────────────────────────────────────────────

interface DetailDialogProps {
  id: string | null;
  onClose: () => void;
  onEdit: (id: string) => void;
}

function DetailDialog({ id, onClose, onEdit }: DetailDialogProps) {
  const { t } = useLanguage();
  const { data: bot, isLoading, error } = useChatbot(id);

  const promptEntries = bot ? Object.entries(bot.prompts ?? {}) : [];

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-screen w-[95vw] !max-w-none overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>{isLoading ? t("loading") : bot?.name ?? t("details")}</DialogTitle>
          <DialogDescription>{t("detailDescription")}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        )}

        {error && (
          <p className="py-4 text-sm text-destructive">
            {t("error")}: {(error as Error).message}
          </p>
        )}

        {bot && (
          <div className="max-h-[70vh] overflow-y-auto space-y-1 py-1">
            {/* Info grid */}
            <section>
              <SectionTitle>{t("basicInfo")}</SectionTitle>
              <div className="grid grid-cols-4 gap-1.5">
                <InfoField label="ID" mono>{bot.id}</InfoField>
                <InfoField label={t("email")}>{bot.email}</InfoField>
                <InfoField label={t("createdAt")} mono>{fmtDate(bot.created_at)}</InfoField>
                <InfoField label={t("updatedAt")} mono>{fmtDate(bot.updated_at)}</InfoField>
                <InfoField label={t("status")}>
                  <Badge variant="outline" className={STATUS_CLS[bot.status]}>
                    {bot.status}
                  </Badge>
                </InfoField>
                <InfoField label={t("primaryColorLabel")}>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ background: bot.primary_color }}
                    />
                    <span className="font-mono text-xs">{bot.primary_color}</span>
                  </div>
                </InfoField>
              </div>
              {bot.description && (
                <p className="mt-3 text-sm text-muted-foreground">{bot.description}</p>
              )}
            </section>

            {/* Prompts section */}
            <section>
              <SectionTitle>
                {t("promptsTab")}
                {promptEntries.length > 0 && (
                  <span className="ml-2 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-violet-400">
                    {promptEntries.length}
                  </span>
                )}
              </SectionTitle>
              {promptEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noPrompts")}</p>
              ) : (
                <div className="space-y-2">
                  {promptEntries.map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-border bg-muted/20 p-3">
                      <p className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                        {key}
                      </p>
                      <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Structure Schema section */}
            <section>
              <SectionTitle>{t("schemaTab")}</SectionTitle>
              {!bot.structure_schema?.trim() ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="whitespace-pre-wrap font-mono text-xs text-muted-foreground leading-relaxed">
                    {bot.structure_schema}
                  </p>
                </div>
              )}
            </section>

            {/* Stats */}
            <section>
              <SectionTitle>{t("statistics")}</SectionTitle>
              <div className="grid grid-cols-4 gap-1.5">
                <InfoField label={t("totalMessages")}>{fmt(bot.stats.total_messages)}</InfoField>
                <InfoField label={t("totalErrors")}>
                  <span className="text-rose-400">{fmt(bot.stats.error_count)}</span>
                </InfoField>
                <InfoField label={t("actualCost")}>
                  <span className="text-emerald-400">{fmtVnd(bot.stats.actual_cost)}</span>
                </InfoField>
                <InfoField label={t("billingCost")}>
                  <span className="text-amber-400">{fmtVnd(bot.stats.scaled_cost)}</span>
                </InfoField>
                <InfoField label={t("avgResponseTime")}>
                  {bot.stats.avg_response_time.toFixed(2)}s
                </InfoField>
              </div>
            </section>

            {/* Usage table */}
            <section>
              <SectionTitle>{t("usageByModel")}</SectionTitle>
              {bot.usage.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noUsageData")}</p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-sm">{t("model")}</TableHead>
                        <TableHead className="text-right text-sm">{t("inputTokens")}</TableHead>
                        <TableHead className="text-right text-sm">{t("outputTokens")}</TableHead>
                        <TableHead className="text-right text-sm">{t("totalTokens")}</TableHead>
                        <TableHead className="text-right text-sm">{t("cacheTokens")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bot.usage.map((u) => (
                        <TableRow key={u.model_name}>
                          <TableCell className="text-sm">
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                              {u.model_name}
                            </code>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(u.input_tokens)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(u.output_tokens)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(u.total_tokens)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(u.cache_read_tokens)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("close")}</Button>
          {bot && (
            <Button onClick={() => { onClose(); onEdit(bot.id); }}>
              {t("edit")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Small shared UI helpers
// ──────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
      {children}
    </p>
  );
}

function InfoField({
  label,
  mono,
  children,
}: {
  label: string;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-muted/30 p-1.5">
      <p className="mb-0.5 text-[10px] text-muted-foreground">{label}</p>
      <div className={mono ? "font-mono text-sm break-all" : "text-base"}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────

export default function AdminPage() {
  const { t } = useLanguage();
  const [params, setParams] = useState<ListParams>({
    page: 1,
    limit: 20,
    status: "",
    search: "",
  });
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Chatbot | null>(null);

  const { data, isLoading } = useChatbots(params);
  const deleteMut = useDeleteChatbot();
  const statusMut = useUpdateStatus();

  const chatbots = data?.data ?? [];
  const pagination = data?.pagination;

  function openCreate() { setEditingId(null); setFormOpen(true); }
  function openEdit(id: string) { setEditingId(id); setFormOpen(true); }

  const editingBot = editingId ? chatbots.find(b => b.id === editingId) : undefined;

  function doSearch() {
    setParams((p) => ({ ...p, search, page: 1 }));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success(t("deleteSuccess"));
      setDeleteTarget(null);
      setParams({ page: 1, limit: 20, status: "", search: "" });
    } catch (e) {
      toast.error(t("deleteError") + (e instanceof Error ? e.message : String(e)));
    }
  }

  async function handleStatusChange(id: string, status: ChatbotStatus) {
    try {
      await statusMut.mutateAsync({ id, status });
      toast.success(`Changed to ${status}`);
      setParams({ page: 1, limit: 20, status: "", search: "" });
    } catch (e) {
      toast.error("Error: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl p-6">
        {/* Overview */}
        <OverviewCards />

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex flex-1 items-center gap-2">
            <Input
              className="max-w-xs"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
            />
            <Button variant="outline" onClick={doSearch}>{t("search")}</Button>
          </div>

          {/* Status filter chips */}
          <div className="flex gap-1.5">
            {(["", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setParams((p) => ({ ...p, status: s, page: 1 }))}
                className={`rounded-full border px-3 py-1 font-mono text-xs font-semibold transition-colors
                  ${params.status === s
                    ? "border-violet-500/60 bg-violet-500/10 text-violet-400"
                    : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
              >
                {s || t("all")}
              </button>
            ))}
          </div>

          <Button onClick={openCreate}>{t("createNew")}</Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chatbot</TableHead>
                <TableHead>{t("statusColumn")}</TableHead>
                <TableHead>{t("color")}</TableHead>
                <TableHead>{t("promptsTab")}</TableHead>
                <TableHead>{t("createdColumn")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(6)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(6)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))}

              {!isLoading && chatbots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                    {t("noChatbots")}
                  </TableCell>
                </TableRow>
              )}

              {chatbots.map((bot) => {
                const promptKeys = Object.keys(bot.prompts ?? {});
                return (
                  <TableRow
                    key={bot.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setDetailId(bot.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {bot.logo_url ? (
                          <img src={bot.logo_url || ""} alt={bot.name} className="h-9 w-9 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <Avatar name={bot.name} color={bot.primary_color} />
                        )}
                        <div>
                          <p className="font-bold">{bot.name}</p>
                          <p className="font-mono text-sm text-muted-foreground">{bot.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className={STATUS_CLS[bot.status]}>
                        {bot.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-4 w-4 rounded-full border border-white/10"
                          style={{ background: bot.primary_color }}
                        />
                        <span className="font-mono text-sm text-muted-foreground">
                          {bot.primary_color}
                        </span>
                      </div>
                    </TableCell>

                    {/* Prompts column */}
                    <TableCell onClick={(e) => { e.stopPropagation(); openEdit(bot.id); }}>
                      {promptKeys.length === 0 ? (
                        <span className="text-xs text-muted-foreground/50 italic">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {promptKeys.slice(0, 3).map((k) => (
                            <span
                              key={k}
                              className="rounded-md border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] text-violet-400"
                            >
                              {k}
                            </span>
                          ))}
                          {promptKeys.length > 3 && (
                            <span className="rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                              +{promptKeys.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {fmtDate(bot.created_at)}
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            ⋯
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setDetailId(bot.id)}>
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(bot.id)}>
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {STATUSES.filter((s) => s !== bot.status).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              onClick={() => handleStatusChange(bot.id, s)}
                            >
                              {t("changeTo")} {s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(bot)}
                          >
                            {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {fmt(pagination.total)} chatbots — page {pagination.page}/{pagination.total_pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setParams((p) => ({ ...p, page: p.page! - 1 }))}
              >
                {t("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setParams((p) => ({ ...p, page: p.page! + 1 }))}
              >
                {t("next")}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Dialogs */}
      <FormDialog
        open={formOpen}
        editingId={editingId}
        editingBot={editingBot}
        onClose={() => setFormOpen(false)}
        onSaveComplete={() => {
          setParams({ page: 1, limit: 20, status: "", search: "" });
        }}
      />

      <DetailDialog
        id={detailId}
        onClose={() => setDetailId(null)}
        onEdit={(id) => { setDetailId(null); openEdit(id); }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmText")}{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>?{" "}
              {t("thisActionCannotBeUndone")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
              onClick={handleDelete}
            >
              {deleteMut.isPending ? t("deletingDots") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}