import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Flame, Snowflake, ThermometerSun, Workflow, Plug, KeyRound, Webhook as WebhookIcon, Brain, ArrowLeft,
  Plus, Trash2, Play, Pause, Copy, RefreshCw, ExternalLink, AlertCircle, CheckCircle2, Loader2, BookOpen,
} from "lucide-react";

function tFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem("tenant_token") || "";
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
  });
}

interface LeadScore { id: number; sessionId: string; userEmail: string; score: number; temperature: "cold"|"warm"|"hot"; intent: string; reasoning: string; nextAction: string; calculatedAt: string; }
interface LeadStats { total: number; cold: number; warm: number; hot: number; avgScore: number; }
interface SequenceItem { id: number; name: string; description: string | null; trigger: string; active: number; steps: string; enrolledCount: number; createdAt: string; }
interface FlowItem { id: number; name: string; description: string | null; triggerType: string; active: number; nodes: string; edges: string; runCount: number; }
interface IntegrationItem { id: number; name: string; provider: string; active: number; config: string; lastUsedAt: string | null; lastError: string | null; }
interface ApiKeyItem { id: number; name: string; prefix: string; mask?: string; fullKey?: string; scopes: string; active: number; lastUsedAt: string | null; createdAt: string; }
interface WebhookItem { id: number; name: string; url: string; events: string[]; active: number; secret: string; failureCount: number; lastDeliveryAt: string | null; }
interface CoachInsights { stats: LeadStats; topHot: LeadScore[]; topWarm: LeadScore[]; sequencesActive: number; sequencesCompleted: number; insights: string[]; }

const ALL_EVENTS = [
  "session.closed",
  "message.user",
  "message.support",
  "lead.scored",
  "lead.hot",
  "lead.qualified",
];

const PROVIDERS = [
  { value: "webhook", label: "Webhook personalizado" },
  { value: "http", label: "HTTP custom" },
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "google_sheets", label: "Google Sheets" },
  { value: "hubspot", label: "HubSpot CRM" },
  { value: "pipedrive", label: "Pipedrive" },
  { value: "airtable", label: "Airtable" },
  { value: "notion", label: "Notion" },
  { value: "mailchimp", label: "Mailchimp" },
  { value: "activecampaign", label: "ActiveCampaign" },
];

const TRIGGER_OPTIONS = [
  { value: "lead_hot", label: "Lead caliente detectado" },
  { value: "lead_warm", label: "Lead tibio detectado" },
  { value: "new_session", label: "Nueva sesión iniciada" },
  { value: "appointment_booked", label: "Cita agendada" },
  { value: "tag_added", label: "Etiqueta agregada" },
  { value: "manual", label: "Manual / API" },
];

export default function SalesEnginePage() {
  const [, setLocation] = useLocation();
  const initialTab = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tab") : null) || "leads";
  const [tab, setTabState] = useState(initialTab);
  const setTab = (t: string) => {
    setTabState(t);
    if (typeof window !== "undefined") {
      const newUrl = `/sales-engine?tab=${t}`;
      window.history.replaceState(null, "", newUrl);
    }
  };
  // Keep setLocation reference (no-op suppresses unused warning)
  void setLocation;
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <header className="border-b border-white/[0.06] bg-[#0f0f12]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white" data-testid="button-back-dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Motor de Ventas IA</h1>
              <p className="text-xs text-white/50">Lead scoring, secuencias automáticas, flujos visuales e integraciones</p>
            </div>
          </div>
          <a href="/api-docs" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-white/[0.08] hover:bg-white/[0.04]" data-testid="link-api-docs">
              <BookOpen className="w-4 h-4 mr-2" /> API Docs
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 flex flex-wrap h-auto">
            <TabsTrigger value="leads" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-leads"><Flame className="w-4 h-4 mr-1.5" /> Leads</TabsTrigger>
            <TabsTrigger value="sequences" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-sequences"><RefreshCw className="w-4 h-4 mr-1.5" /> Secuencias</TabsTrigger>
            <TabsTrigger value="flows" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-flows"><Workflow className="w-4 h-4 mr-1.5" /> Flujos</TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-integrations"><Plug className="w-4 h-4 mr-1.5" /> Integraciones</TabsTrigger>
            <TabsTrigger value="api" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-api"><KeyRound className="w-4 h-4 mr-1.5" /> API & Webhooks</TabsTrigger>
            <TabsTrigger value="coach" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white" data-testid="tab-coach"><Brain className="w-4 h-4 mr-1.5" /> Sales Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="mt-6"><LeadsTab toast={toast} /></TabsContent>
          <TabsContent value="sequences" className="mt-6"><SequencesTab toast={toast} /></TabsContent>
          <TabsContent value="flows" className="mt-6"><FlowsTab toast={toast} /></TabsContent>
          <TabsContent value="integrations" className="mt-6"><IntegrationsTab toast={toast} /></TabsContent>
          <TabsContent value="api" className="mt-6"><ApiTab toast={toast} /></TabsContent>
          <TabsContent value="coach" className="mt-6"><CoachTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================================
function LeadsTab({ toast }: { toast: any }) {
  const [filter, setFilter] = useState<string>("all");
  const { data: stats } = useQuery<LeadStats>({
    queryKey: ["/api/sales/lead-scores/stats"],
    queryFn: async () => { const r = await tFetch("/api/sales/lead-scores/stats"); return r.json(); },
    refetchInterval: 30000,
  });
  const { data: leads = [], isLoading } = useQuery<LeadScore[]>({
    queryKey: ["/api/sales/lead-scores", filter],
    queryFn: async () => {
      const q = filter === "all" ? "" : `?temperature=${filter}`;
      const r = await tFetch(`/api/sales/lead-scores${q}`);
      if (r.status === 402) { toast({ title: "Plan requerido", description: "Esta función requiere un plan Solo o superior" }); return []; }
      return r.json();
    },
  });

  const tempCard = (label: string, value: number, icon: any, color: string, key: string) => (
    <Card className={`bg-white/[0.03] border-white/[0.06] cursor-pointer transition hover:bg-white/[0.05] ${filter === key ? "ring-2 ring-primary" : ""}`} onClick={() => setFilter(key)} data-testid={`card-leads-${key}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/50 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tempCard("Total", stats?.total || 0, <Brain className="w-7 h-7 text-primary/70" />, "#a394f7", "all")}
        {tempCard("Calientes", stats?.hot || 0, <Flame className="w-7 h-7 text-red-400" />, "#f87171", "hot")}
        {tempCard("Tibios", stats?.warm || 0, <ThermometerSun className="w-7 h-7 text-amber-400" />, "#fbbf24", "warm")}
        {tempCard("Fríos", stats?.cold || 0, <Snowflake className="w-7 h-7 text-slate-400" />, "#94a3b8", "cold")}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : leads.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-12 text-center text-white/50">
          <Brain className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm">Sin leads aún. Cappta IA puntuará automáticamente cada conversación con 2+ mensajes.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {leads.map(l => (
            <Card key={l.id} className="bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] transition" data-testid={`card-lead-${l.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${l.temperature === "hot" ? "bg-red-500/20 text-red-400" : l.temperature === "warm" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400"}`}>
                        {l.temperature === "hot" ? "🔥" : l.temperature === "warm" ? "♨︎" : "❄"} {l.score}/100
                      </span>
                      <p className="text-sm font-semibold text-white truncate">{l.userEmail}</p>
                    </div>
                    <p className="text-sm text-white/70 mt-1"><span className="text-white/40">Intención:</span> {l.intent}</p>
                    {l.nextAction && <p className="text-xs text-primary mt-1.5"><span className="text-white/40">Acción sugerida:</span> {l.nextAction}</p>}
                    {l.reasoning && <p className="text-xs text-white/50 mt-2 line-clamp-2">{l.reasoning}</p>}
                  </div>
                  <div className="text-right text-xs text-white/40 shrink-0">
                    {new Date(l.calculatedAt).toLocaleString("es-CL")}
                    <Link href={`/panel?session=${l.sessionId}`}><Button size="sm" variant="ghost" className="mt-2 text-primary hover:bg-primary/10" data-testid={`button-open-session-${l.id}`}>Abrir chat <ExternalLink className="w-3 h-3 ml-1" /></Button></Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
function SequencesTab({ toast }: { toast: any }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SequenceItem | null>(null);
  const { data: sequences = [], isLoading } = useQuery<SequenceItem[]>({
    queryKey: ["/api/sales/sequences"],
    queryFn: async () => { const r = await tFetch("/api/sales/sequences"); if (r.status === 402) return []; return r.json(); },
  });

  const toggleActive = useMutation({
    mutationFn: async (s: SequenceItem) => {
      const r = await tFetch(`/api/sales/sequences/${s.id}`, { method: "PATCH", body: JSON.stringify({ active: s.active === 1 ? 0 : 1 }) });
      if (!r.ok) throw new Error(await r.text());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/sequences"] }),
  });
  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await tFetch(`/api/sales/sequences/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/sequences"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/60">Secuencias automatizadas de seguimiento por canal de chat o email.</p>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-sequence"><Plus className="w-4 h-4 mr-1" /> Nueva secuencia</Button>
      </div>

      {isLoading ? <div className="text-center py-8 text-white/40"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      : sequences.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-12 text-center text-white/50">
          <RefreshCw className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm">Sin secuencias creadas. Crea tu primera para automatizar el seguimiento.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {sequences.map(s => {
            let steps: any[] = []; try { steps = JSON.parse(s.steps); } catch {}
            return (
              <Card key={s.id} className="bg-white/[0.03] border-white/[0.06]" data-testid={`card-sequence-${s.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{s.name}</h3>
                      <Badge variant="outline" className="text-[10px]">{TRIGGER_OPTIONS.find(t => t.value === s.trigger)?.label || s.trigger}</Badge>
                      <Badge variant="outline" className="text-[10px]">{steps.length} pasos</Badge>
                      <Badge variant="outline" className="text-[10px]">{s.enrolledCount} enrolados</Badge>
                    </div>
                    {s.description && <p className="text-xs text-white/50 mt-1">{s.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={s.active === 1} onCheckedChange={() => toggleActive.mutate(s)} data-testid={`switch-active-${s.id}`} />
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }} data-testid={`button-edit-sequence-${s.id}`}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={() => { if (confirm(`Eliminar "${s.name}"?`)) deleteMut.mutate(s.id); }} data-testid={`button-delete-sequence-${s.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SequenceDialog open={open} onClose={() => setOpen(false)} editing={editing} toast={toast} />
    </div>
  );
}

function SequenceDialog({ open, onClose, editing, toast }: { open: boolean; onClose: () => void; editing: SequenceItem | null; toast: any }) {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [trigger, setTrigger] = useState(editing?.trigger || "lead_warm");
  const defaultSteps = JSON.stringify([
    { type: "wait", delayMinutes: 5 },
    { type: "send_message", message: "Hola {{name}}, gracias por tu interés. ¿Hay algo en lo que te pueda ayudar?" },
    { type: "wait", delayMinutes: 60 },
    { type: "send_email", subject: "Seguimiento", message: "Hola {{name}},\n\nQuería saber si pudiste revisar nuestra propuesta." },
  ], null, 2);
  const [stepsJson, setStepsJson] = useState(editing?.steps || defaultSteps);

  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setDescription(editing?.description || "");
      setTrigger(editing?.trigger || "lead_warm");
      setStepsJson(editing?.steps || defaultSteps);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  const save = useMutation({
    mutationFn: async () => {
      let steps: any[] = [];
      try { steps = JSON.parse(stepsJson); } catch { throw new Error("JSON de pasos inválido"); }
      const body = { name, description, trigger, steps: JSON.stringify(steps), active: editing?.active ?? 1 };
      const url = editing ? `/api/sales/sequences/${editing.id}` : "/api/sales/sequences";
      const method = editing ? "PATCH" : "POST";
      const r = await tFetch(url, { method, body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).message || "Error");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales/sequences"] });
      toast({ title: "Guardado", description: "Secuencia actualizada" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f12] border-white/[0.08] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar secuencia" : "Nueva secuencia"}</DialogTitle>
          <DialogDescription>Cada paso ejecuta una acción y opcionalmente espera antes del siguiente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-sequence-name" /></div>
          <div><Label>Descripción</Label><Input value={description} onChange={e => setDescription(e.target.value)} data-testid="input-sequence-description" /></div>
          <div>
            <Label>Disparador</Label>
            <Select value={trigger} onValueChange={setTrigger}>
              <SelectTrigger data-testid="select-sequence-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>{TRIGGER_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pasos (JSON)</Label>
            <Textarea rows={14} value={stepsJson} onChange={e => setStepsJson(e.target.value)} className="font-mono text-xs" data-testid="textarea-sequence-steps" />
            <p className="text-[11px] text-white/40 mt-1">
              Tipos: <code>wait</code>, <code>send_message</code>, <code>send_email</code>, <code>tag</code>, <code>webhook</code>. Variables: <code>{`{{name}}, {{email}}, {{firstName}}`}</code>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()} className="bg-primary" data-testid="button-save-sequence">
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
function FlowsTab({ toast }: { toast: any }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FlowItem | null>(null);
  const { data: flows = [], isLoading } = useQuery<FlowItem[]>({
    queryKey: ["/api/sales/flows"],
    queryFn: async () => { const r = await tFetch("/api/sales/flows"); if (r.status === 402) return []; return r.json(); },
  });

  const toggleMut = useMutation({
    mutationFn: async (f: FlowItem) => { await tFetch(`/api/sales/flows/${f.id}`, { method: "PATCH", body: JSON.stringify({ active: f.active === 1 ? 0 : 1 }) }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/flows"] }),
  });
  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await tFetch(`/api/sales/flows/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/flows"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Flujos: trigger → acciones → integraciones, con condiciones y ramas.</p>
          <p className="text-xs text-white/40 mt-1">Define el grafo de nodos en JSON. Tipos soportados: <code>send_message</code>, <code>tag</code>, <code>lead_score</code>, <code>http</code>, <code>wait</code>, <code>condition</code>, <code>branch</code>.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-primary hover:bg-primary/90" data-testid="button-new-flow"><Plus className="w-4 h-4 mr-1" /> Nuevo flujo</Button>
      </div>

      {isLoading ? <div className="text-center py-8 text-white/40"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      : flows.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-12 text-center text-white/50">
          <Workflow className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm">Aún no tienes flujos. Crea uno para automatizar acciones complejas.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {flows.map(f => {
            let nodes: any[] = []; try { nodes = JSON.parse(f.nodes); } catch {}
            return (
              <Card key={f.id} className="bg-white/[0.03] border-white/[0.06]" data-testid={`card-flow-${f.id}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{f.name}</h3>
                      <Badge variant="outline" className="text-[10px]">trigger: {f.triggerType}</Badge>
                      <Badge variant="outline" className="text-[10px]">{nodes.length} nodos</Badge>
                      <Badge variant="outline" className="text-[10px]">{f.runCount} ejecuciones</Badge>
                    </div>
                    {f.description && <p className="text-xs text-white/50 mt-1">{f.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={f.active === 1} onCheckedChange={() => toggleMut.mutate(f)} data-testid={`switch-flow-${f.id}`} />
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }} data-testid={`button-edit-flow-${f.id}`}>Editar</Button>
                    <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm(`Eliminar "${f.name}"?`)) deleteMut.mutate(f.id); }} data-testid={`button-delete-flow-${f.id}`}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <FlowDialog open={open} onClose={() => setOpen(false)} editing={editing} toast={toast} />
    </div>
  );
}

function FlowDialog({ open, onClose, editing, toast }: { open: boolean; onClose: () => void; editing: FlowItem | null; toast: any }) {
  const defaultNodes = `[
  {"id":"trigger","type":"trigger","data":{}},
  {"id":"msg1","type":"send_message","data":{"message":"Hola {{name}}, soy de ventas, ¿cómo te puedo ayudar?"}},
  {"id":"end","type":"end","data":{}}
]`;
  const defaultEdges = `[
  {"id":"e1","source":"trigger","target":"msg1"},
  {"id":"e2","source":"msg1","target":"end"}
]`;
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [triggerType, setTriggerType] = useState(editing?.triggerType || "lead_hot");
  const [nodesJson, setNodesJson] = useState(editing?.nodes || defaultNodes);
  const [edgesJson, setEdgesJson] = useState(editing?.edges || defaultEdges);

  useEffect(() => {
    if (open) {
      setName(editing?.name || ""); setDescription(editing?.description || "");
      setTriggerType(editing?.triggerType || "lead_hot");
      setNodesJson(editing?.nodes || defaultNodes); setEdgesJson(editing?.edges || defaultEdges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  const save = useMutation({
    mutationFn: async () => {
      let nodes: any[] = [], edges: any[] = [];
      try { nodes = JSON.parse(nodesJson); } catch { throw new Error("Nodes JSON inválido"); }
      try { edges = JSON.parse(edgesJson); } catch { throw new Error("Edges JSON inválido"); }
      const body = { name, description, triggerType, nodes: JSON.stringify(nodes), edges: JSON.stringify(edges), active: editing?.active ?? 1 };
      const url = editing ? `/api/sales/flows/${editing.id}` : "/api/sales/flows";
      const r = await tFetch(url, { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error((await r.json()).message || "Error");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sales/flows"] }); toast({ title: "Guardado" }); onClose(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f12] border-white/[0.08] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar flujo" : "Nuevo flujo"}</DialogTitle>
          <DialogDescription>Tipos de nodo: <code>trigger</code>, <code>send_message</code>, <code>wait</code>, <code>condition</code>, <code>tag</code>, <code>lead_score</code>, <code>integration</code>, <code>end</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-flow-name" /></div>
            <div>
              <Label>Trigger</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger data-testid="select-flow-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_hot">Lead caliente</SelectItem>
                  <SelectItem value="lead_warm">Lead tibio</SelectItem>
                  <SelectItem value="new_session">Nueva sesión</SelectItem>
                  <SelectItem value="new_message">Nuevo mensaje</SelectItem>
                  <SelectItem value="tag_added">Etiqueta agregada</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Descripción</Label><Input value={description} onChange={e => setDescription(e.target.value)} data-testid="input-flow-description" /></div>
          <div><Label>Nodos (JSON)</Label><Textarea rows={8} value={nodesJson} onChange={e => setNodesJson(e.target.value)} className="font-mono text-xs" data-testid="textarea-flow-nodes" /></div>
          <div><Label>Conexiones / Edges (JSON)</Label><Textarea rows={5} value={edgesJson} onChange={e => setEdgesJson(e.target.value)} className="font-mono text-xs" data-testid="textarea-flow-edges" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()} className="bg-primary" data-testid="button-save-flow">
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
function IntegrationsTab({ toast }: { toast: any }) {
  const [open, setOpen] = useState(false);
  const { data: integrations = [], isLoading } = useQuery<IntegrationItem[]>({
    queryKey: ["/api/sales/integrations"],
    queryFn: async () => { const r = await tFetch("/api/sales/integrations"); if (r.status === 402) return []; return r.json(); },
  });

  const toggleMut = useMutation({
    mutationFn: async (i: IntegrationItem) => { await tFetch(`/api/sales/integrations/${i.id}`, { method: "PATCH", body: JSON.stringify({ active: i.active === 1 ? 0 : 1 }) }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/integrations"] }),
  });
  const deleteMut = useMutation({
    mutationFn: async (id: number) => { await tFetch(`/api/sales/integrations/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/integrations"] }),
  });
  const testMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await tFetch(`/api/sales/integrations/${id}/test`, { method: "POST" });
      return r.json();
    },
    onSuccess: (data) => toast({ title: data.ok ? "Conexión OK" : "Falló", description: data.ok ? "Test enviado correctamente" : (data.error || `Status ${data.status}`), variant: data.ok ? "default" : "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Conecta Cappta con Slack, HubSpot, Sheets y más. Úsalas dentro de tus flujos.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary" data-testid="button-new-integration"><Plus className="w-4 h-4 mr-1" /> Nueva integración</Button>
      </div>

      {isLoading ? <div className="text-center py-8 text-white/40"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      : integrations.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/[0.06]"><CardContent className="p-12 text-center text-white/50">
          <Plug className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-sm">Sin integraciones. Agrega tu primera para enviar leads a otros sistemas.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {integrations.map(i => (
            <Card key={i.id} className="bg-white/[0.03] border-white/[0.06]" data-testid={`card-integration-${i.id}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{i.name}</h3>
                    <Badge variant="outline" className="text-[10px]">{PROVIDERS.find(p => p.value === i.provider)?.label || i.provider}</Badge>
                    {i.lastError && <Badge variant="destructive" className="text-[10px]">⚠ {i.lastError.slice(0, 40)}</Badge>}
                  </div>
                  {i.lastUsedAt && <p className="text-xs text-white/50 mt-1">Último uso: {new Date(i.lastUsedAt).toLocaleString("es-CL")}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={i.active === 1} onCheckedChange={() => toggleMut.mutate(i)} data-testid={`switch-integration-${i.id}`} />
                  <Button size="sm" variant="outline" onClick={() => testMut.mutate(i.id)} disabled={testMut.isPending} data-testid={`button-test-integration-${i.id}`}><Play className="w-3.5 h-3.5 mr-1" />Test</Button>
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm(`Eliminar "${i.name}"?`)) deleteMut.mutate(i.id); }} data-testid={`button-delete-integration-${i.id}`}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <IntegrationDialog open={open} onClose={() => setOpen(false)} toast={toast} />
    </div>
  );
}

function IntegrationDialog({ open, onClose, toast }: { open: boolean; onClose: () => void; toast: any }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("slack");
  const [configJson, setConfigJson] = useState(`{"webhookUrl":"https://hooks.slack.com/services/..."}`);
  const [credsJson, setCredsJson] = useState("");

  const placeholders: Record<string, { config: string; creds: string }> = {
    webhook: { config: `{"url":"https://example.com/webhook","method":"POST"}`, creds: "" },
    http: { config: `{"url":"https://api.example.com/endpoint","method":"POST","headers":{}}`, creds: "" },
    slack: { config: `{"webhookUrl":"https://hooks.slack.com/services/..."}`, creds: "" },
    discord: { config: `{"webhookUrl":"https://discord.com/api/webhooks/..."}`, creds: "" },
    teams: { config: `{"webhookUrl":"https://outlook.office.com/webhook/..."}`, creds: "" },
    google_sheets: { config: `{"appendUrl":"https://script.google.com/macros/s/.../exec","sheetName":"Leads"}`, creds: `{"apiKey":"opcional"}` },
    hubspot: { config: `{}`, creds: `{"accessToken":"pat-na1-..."}` },
    pipedrive: { config: `{"domain":"yourcompany"}`, creds: `{"apiToken":"..."}` },
    airtable: { config: `{"baseId":"app...","tableName":"Leads"}`, creds: `{"apiKey":"pat..."}` },
    notion: { config: `{"databaseId":"..."}`, creds: `{"apiKey":"secret_..."}` },
    mailchimp: { config: `{"listId":"...","dc":"us19"}`, creds: `{"apiKey":"..."}` },
    activecampaign: { config: `{"apiUrl":"https://yourcompany.api-us1.com"}`, creds: `{"apiKey":"..."}` },
  };

  const onProviderChange = (p: string) => {
    setProvider(p);
    const def = placeholders[p];
    if (def) { setConfigJson(def.config); setCredsJson(def.creds); }
  };

  const save = useMutation({
    mutationFn: async () => {
      let config: any = {}, credentials: any = {};
      try { config = JSON.parse(configJson || "{}"); } catch { throw new Error("Config JSON inválido"); }
      if (credsJson.trim()) { try { credentials = JSON.parse(credsJson); } catch { throw new Error("Credentials JSON inválido"); } }
      const r = await tFetch("/api/sales/integrations", {
        method: "POST",
        body: JSON.stringify({ name, provider, config: JSON.stringify(config), credentials: Object.keys(credentials).length ? JSON.stringify(credentials) : null, active: 1 }),
      });
      if (!r.ok) throw new Error((await r.json()).message || "Error");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sales/integrations"] }); toast({ title: "Integración creada" }); onClose(); setName(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f12] border-white/[0.08] max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nueva integración</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Slack equipo ventas" data-testid="input-integration-name" /></div>
          <div>
            <Label>Proveedor</Label>
            <Select value={provider} onValueChange={onProviderChange}>
              <SelectTrigger data-testid="select-integration-provider"><SelectValue /></SelectTrigger>
              <SelectContent>{PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Configuración (JSON público)</Label><Textarea rows={4} value={configJson} onChange={e => setConfigJson(e.target.value)} className="font-mono text-xs" data-testid="textarea-integration-config" /></div>
          <div><Label>Credenciales (JSON privado, encriptado en reposo en producción)</Label><Textarea rows={3} value={credsJson} onChange={e => setCredsJson(e.target.value)} className="font-mono text-xs" placeholder="{}" data-testid="textarea-integration-creds" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()} className="bg-primary" data-testid="button-save-integration">{save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
function ApiTab({ toast }: { toast: any }) {
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null);
  const [whOpen, setWhOpen] = useState(false);

  const { data: keys = [] } = useQuery<ApiKeyItem[]>({
    queryKey: ["/api/sales/api-keys"],
    queryFn: async () => { const r = await tFetch("/api/sales/api-keys"); if (r.status === 402) return []; return r.json(); },
  });
  const { data: webhooks = [] } = useQuery<WebhookItem[]>({
    queryKey: ["/api/sales/webhooks"],
    queryFn: async () => { const r = await tFetch("/api/sales/webhooks"); if (r.status === 402) return []; return r.json(); },
  });

  const createKey = useMutation({
    mutationFn: async () => {
      const r = await tFetch("/api/sales/api-keys", { method: "POST", body: JSON.stringify({ name: newKeyName, scopes: ["sessions.read", "messages.read", "messages.write", "leads.read", "leads.write"] }) });
      if (!r.ok) throw new Error("Error");
      return r.json();
    },
    onSuccess: (k: any) => { queryClient.invalidateQueries({ queryKey: ["/api/sales/api-keys"] }); setNewKeyVisible(k.fullKey); setNewKeyName(""); },
  });
  const revokeKey = useMutation({
    mutationFn: async (id: number) => { await tFetch(`/api/sales/api-keys/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/api-keys"] }),
  });

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><KeyRound className="w-5 h-5 text-primary" /> API Keys</h2>
        <p className="text-sm text-white/60 mb-4">Llaves para acceder a la <a href="/api-docs" target="_blank" className="text-primary underline">REST API pública</a>. Solo se muestra el valor completo una vez al crearla.</p>

        <Card className="bg-white/[0.03] border-white/[0.06] mb-4">
          <CardContent className="p-4 flex items-end gap-3">
            <div className="flex-1"><Label>Nombre de la API key</Label><Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="Ej: integración Zapier" data-testid="input-apikey-name" /></div>
            <Button onClick={() => createKey.mutate()} disabled={createKey.isPending || !newKeyName.trim()} className="bg-primary" data-testid="button-create-apikey">{createKey.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Crear API Key</Button>
          </CardContent>
        </Card>

        {newKeyVisible && (
          <Card className="bg-amber-500/10 border-amber-500/30 mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-amber-300 font-bold text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Guarda esta llave ahora — no se volverá a mostrar</p>
                  <code className="block mt-2 p-2 bg-black/40 rounded text-xs text-emerald-300 break-all" data-testid="text-new-apikey">{newKeyVisible}</code>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKeyVisible); toast({ title: "Copiada al portapapeles" }); }} data-testid="button-copy-apikey"><Copy className="w-3.5 h-3.5 mr-1" />Copiar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setNewKeyVisible(null)} data-testid="button-dismiss-apikey">Listo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {keys.length === 0 ? <p className="text-sm text-white/40 text-center py-6">Sin API keys aún.</p> : keys.map(k => (
            <Card key={k.id} className="bg-white/[0.02] border-white/[0.06]" data-testid={`card-apikey-${k.id}`}>
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h4 className="font-semibold text-sm">{k.name}</h4>{k.active === 0 && <Badge variant="destructive" className="text-[10px]">Revocada</Badge>}</div>
                  <code className="text-xs text-white/40">{k.prefix}…</code>
                  <p className="text-[11px] text-white/40 mt-0.5">Creada {new Date(k.createdAt).toLocaleDateString("es-CL")} • {k.lastUsedAt ? `Último uso ${new Date(k.lastUsedAt).toLocaleDateString("es-CL")}` : "Sin uso"}</p>
                </div>
                {k.active === 1 && <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm(`Revocar "${k.name}"?`)) revokeKey.mutate(k.id); }} data-testid={`button-revoke-apikey-${k.id}`}>Revocar</Button>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2"><WebhookIcon className="w-5 h-5 text-primary" /> Webhooks salientes</h2>
          <Button onClick={() => setWhOpen(true)} className="bg-primary" data-testid="button-new-webhook"><Plus className="w-4 h-4 mr-1" /> Nuevo webhook</Button>
        </div>
        <p className="text-sm text-white/60 mb-4">Notifica a tus sistemas externos cuando ocurran eventos. Cada delivery incluye firma HMAC-SHA256.</p>

        <div className="space-y-2">
          {webhooks.length === 0 ? <p className="text-sm text-white/40 text-center py-6">Sin webhooks configurados.</p> : webhooks.map(w => <WebhookRow key={w.id} w={w} toast={toast} />)}
        </div>

        <WebhookDialog open={whOpen} onClose={() => setWhOpen(false)} toast={toast} />
      </section>
    </div>
  );
}

function WebhookRow({ w, toast }: { w: WebhookItem; toast: any }) {
  const deleteMut = useMutation({
    mutationFn: async () => { await tFetch(`/api/sales/webhooks/${w.id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sales/webhooks"] }),
  });
  const testMut = useMutation({
    mutationFn: async () => { const r = await tFetch(`/api/sales/webhooks/${w.id}/test`, { method: "POST" }); return r.json(); },
    onSuccess: () => toast({ title: "Test enviado", description: "Revisa el log de deliveries en unos segundos" }),
  });
  return (
    <Card className="bg-white/[0.02] border-white/[0.06]" data-testid={`card-webhook-${w.id}`}>
      <CardContent className="p-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2"><h4 className="font-semibold text-sm">{w.name}</h4>{w.active === 0 && <Badge variant="destructive" className="text-[10px]">Inactivo</Badge>}{w.failureCount > 0 && <Badge variant="destructive" className="text-[10px]">{w.failureCount} fallos</Badge>}</div>
          <p className="text-xs text-white/50 truncate">{w.url}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">{(w.events || []).slice(0, 8).map(e => <span key={e} className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{e}</span>)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={() => testMut.mutate()} disabled={testMut.isPending} data-testid={`button-test-webhook-${w.id}`}>Test</Button>
          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => { if (confirm(`Eliminar "${w.name}"?`)) deleteMut.mutate(); }} data-testid={`button-delete-webhook-${w.id}`}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookDialog({ open, onClose, toast }: { open: boolean; onClose: () => void; toast: any }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["lead.hot"]);
  const save = useMutation({
    mutationFn: async () => {
      const r = await tFetch("/api/sales/webhooks", { method: "POST", body: JSON.stringify({ name, url, events, active: 1 }) });
      if (!r.ok) throw new Error((await r.json()).message || "Error");
      return r.json();
    },
    onSuccess: (w: any) => { queryClient.invalidateQueries({ queryKey: ["/api/sales/webhooks"] }); toast({ title: "Webhook creado", description: `Secret: ${w.secret} (guárdalo)` }); onClose(); setName(""); setUrl(""); setEvents(["lead.hot"]); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const toggleEv = (e: string) => setEvents(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0f0f12] border-white/[0.08] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nuevo webhook</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="input-webhook-name" /></div>
          <div><Label>URL</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/webhook" data-testid="input-webhook-url" /></div>
          <div>
            <Label>Eventos a notificar</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALL_EVENTS.map(e => (
                <button key={e} type="button" onClick={() => toggleEv(e)} data-testid={`toggle-event-${e}`} className={`text-xs px-2.5 py-1.5 rounded border ${events.includes(e) ? "bg-primary text-white border-primary" : "bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08]"}`}>{e}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim() || !url.trim() || !events.length} className="bg-primary" data-testid="button-save-webhook">{save.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
function CoachTab() {
  const { data: insights, isLoading } = useQuery<CoachInsights>({
    queryKey: ["/api/sales/coach/insights"],
    queryFn: async () => { const r = await tFetch("/api/sales/coach/insights"); if (r.status === 402) throw new Error("plan"); return r.json(); },
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="text-center py-12 text-white/40"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  if (!insights) return <p className="text-center py-12 text-white/40">Sin datos</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Score promedio" value={insights.stats.avgScore} accent="#a394f7" />
        <StatCard label="Total leads" value={insights.stats.total} accent="#a394f7" />
        <StatCard label="🔥 Calientes" value={insights.stats.hot} accent="#f87171" />
        <StatCard label="♨︎ Tibios" value={insights.stats.warm} accent="#fbbf24" />
        <StatCard label="❄ Fríos" value={insights.stats.cold} accent="#94a3b8" />
      </div>

      <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/30" data-testid="card-coach-insights">
        <CardContent className="p-6">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-3"><Brain className="w-5 h-5 text-primary" /> Insights del coach</h3>
          <ul className="space-y-2">
            {insights.insights.map((ins, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-white/85">{ins}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/[0.04] rounded-lg p-3">
              <p className="text-xs text-white/50">Secuencias activas</p>
              <p className="text-2xl font-bold text-primary">{insights.sequencesActive}</p>
            </div>
            <div className="bg-white/[0.04] rounded-lg p-3">
              <p className="text-xs text-white/50">Secuencias completadas</p>
              <p className="text-2xl font-bold text-emerald-400">{insights.sequencesCompleted}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-red-400" /> Top 5 leads calientes</h3>
            {insights.topHot.length === 0 ? <p className="text-sm text-white/40">Sin leads calientes</p> : (
              <ul className="space-y-2">{insights.topHot.map(l => (
                <li key={l.id} className="text-sm flex items-center justify-between" data-testid={`coach-hot-${l.id}`}>
                  <div className="min-w-0 flex-1"><p className="font-medium truncate">{l.userEmail}</p><p className="text-xs text-white/50 truncate">{l.intent}</p></div>
                  <span className="text-red-400 font-bold ml-2">{l.score}</span>
                </li>
              ))}</ul>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ThermometerSun className="w-4 h-4 text-amber-400" /> Top 5 leads tibios</h3>
            {insights.topWarm.length === 0 ? <p className="text-sm text-white/40">Sin leads tibios</p> : (
              <ul className="space-y-2">{insights.topWarm.map(l => (
                <li key={l.id} className="text-sm flex items-center justify-between" data-testid={`coach-warm-${l.id}`}>
                  <div className="min-w-0 flex-1"><p className="font-medium truncate">{l.userEmail}</p><p className="text-xs text-white/50 truncate">{l.intent}</p></div>
                  <span className="text-amber-400 font-bold ml-2">{l.score}</span>
                </li>
              ))}</ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Card className="bg-white/[0.03] border-white/[0.06]"><CardContent className="p-3">
      <p className="text-[11px] text-white/50 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</p>
    </CardContent></Card>
  );
}
