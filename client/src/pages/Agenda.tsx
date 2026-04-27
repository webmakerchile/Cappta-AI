import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, Clock, Check, ArrowLeft } from "lucide-react";
import { formatMoney } from "@shared/currencies";

interface SlotData {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  requiresPayment: boolean;
  availability: string;
  tenantName: string;
  currency?: string;
}

interface Availability {
  taken: { start: string; end: string }[];
}

const WEEKDAY_LABEL = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function generateDays(count: number): Date[] {
  const today = startOfDay(new Date());
  const result: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(d);
  }
  return result;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

type AvailabilityMap = Record<string, { start: string; end: string }[]>;

function parseAvailability(raw: unknown): AvailabilityMap {
  if (!raw) return {};
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as AvailabilityMap; } catch { return {}; }
  }
  if (typeof raw === "object") return raw as AvailabilityMap;
  return {};
}

function generateSlotsForDay(day: Date, slot: SlotData, taken: { start: string; end: string }[]): Date[] {
  const availMap = parseAvailability(slot.availability);
  const wd = day.getDay();
  const ranges = availMap[WEEKDAY_KEYS[wd]] || availMap[String(wd)] || [];
  const candidates: Date[] = [];
  const now = new Date();
  for (const r of ranges) {
    const [sh, sm] = (r.start || "09:00").split(":").map(Number);
    const [eh, em] = (r.end || "17:00").split(":").map(Number);
    const start = new Date(day);
    start.setHours(sh || 0, sm || 0, 0, 0);
    const end = new Date(day);
    end.setHours(eh || 0, em || 0, 0, 0);
    let cur = new Date(start);
    while (cur.getTime() + slot.durationMinutes * 60000 <= end.getTime()) {
      if (cur.getTime() > now.getTime()) {
        candidates.push(new Date(cur));
      }
      cur = new Date(cur.getTime() + slot.durationMinutes * 60000);
    }
  }
  return candidates.filter(c => {
    const cStart = c.getTime();
    const cEnd = cStart + slot.durationMinutes * 60000;
    return !taken.some(t => {
      const tStart = new Date(t.start).getTime();
      const tEnd = new Date(t.end).getTime();
      return cStart < tEnd && cEnd > tStart;
    });
  });
}

export default function Agenda() {
  const { toast } = useToast();
  const slotId = useMemo(() => {
    const m = window.location.pathname.match(/^\/agenda\/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  }, []);

  const [selectedDay, setSelectedDay] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [success, setSuccess] = useState<{ scheduledAt: string; paymentUrl: string | null } | null>(null);

  const { data: slot, isLoading } = useQuery<SlotData>({
    queryKey: ["/api/connect/public/slot", slotId],
    queryFn: async () => {
      const res = await fetch(`/api/connect/public/slot/${slotId}`);
      if (!res.ok) throw new Error("not found");
      return res.json();
    },
    enabled: slotId > 0,
  });

  const { data: avail } = useQuery<Availability>({
    queryKey: ["/api/connect/public/slot/availability", slotId],
    queryFn: async () => {
      const from = new Date();
      const to = new Date(from.getTime() + 14 * 86400000);
      const res = await fetch(`/api/connect/public/slot/${slotId}/availability?from=${from.toISOString()}&to=${to.toISOString()}`);
      if (!res.ok) throw new Error("err");
      return res.json();
    },
    enabled: slotId > 0,
  });

  const days = useMemo(() => generateDays(14), []);
  const dayTimes = useMemo(() => {
    if (!slot) return [];
    return generateSlotsForDay(selectedDay, slot, avail?.taken || []);
  }, [selectedDay, slot, avail]);

  const book = useMutation({
    mutationFn: async () => {
      if (!selectedTime) throw new Error("Selecciona una hora");
      const res = await fetch("/api/connect/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          scheduledAt: selectedTime.toISOString(),
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      return data;
    },
    onSuccess: (data) => {
      setSuccess({ scheduledAt: data.scheduledAt, paymentUrl: data.paymentUrl });
      if (data.paymentUrl) {
        setTimeout(() => { window.location.href = data.paymentUrl; }, 1500);
      }
    },
    onError: (e: Error) => toast({ title: "No se pudo reservar", description: e.message, variant: "destructive" }),
  });

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

  if (slotId === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white p-6">
        <p data-testid="text-invalid-slot">Link de agenda inválido.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white p-6 text-center">
        <div>
          <p className="text-xl font-bold mb-2" data-testid="text-slot-not-found">Servicio no disponible</p>
          <a href="/" className="text-primary hover:underline text-sm">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white p-6">
        <div className="max-w-md w-full rounded-2xl glass-card p-8 text-center">
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2" data-testid="text-success-title">¡Reserva confirmada!</h1>
          <p className="text-white/60 mb-4">Te esperamos el {new Date(success.scheduledAt).toLocaleString("es-CL", { dateStyle: "full", timeStyle: "short" })}.</p>
          {success.paymentUrl && (
            <p className="text-sm text-amber-400 mb-3">Te estamos redirigiendo al pago...</p>
          )}
          <a href="/" className="text-primary hover:underline text-sm">Volver al inicio</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <a href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 mb-4" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4" /> Volver
        </a>

        <div className="rounded-2xl glass-card p-6 sm:p-8 mb-4">
          <p className="text-xs text-primary mb-2" data-testid="text-tenant-name">{slot.tenantName}</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-slot-name">{slot.name}</h1>
          {slot.description && <p className="text-sm text-white/60 mb-3">{slot.description}</p>}
          <div className="flex flex-wrap gap-3 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {slot.durationMinutes} min</span>
            {slot.price ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold" data-testid="text-slot-price">{formatMoney(slot.price, slot.currency || "CLP")}{slot.requiresPayment ? " · pago al reservar" : ""}</span>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl glass-card p-6 sm:p-8 mb-4">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Elige día</h2>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {days.map(d => {
              const isSelected = d.toDateString() === selectedDay.toDateString();
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => { setSelectedDay(d); setSelectedTime(null); }}
                  className={`p-2 rounded-lg text-center transition-all ${isSelected ? "bg-primary text-white" : "bg-white/[0.03] hover:bg-white/[0.06] text-white/70"}`}
                  data-testid={`button-day-${d.toISOString().slice(0,10)}`}
                >
                  <div className="text-[10px]">{WEEKDAY_LABEL[d.getDay()]}</div>
                  <div className="text-sm font-bold">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          <h3 className="font-semibold text-sm mb-3">Horarios disponibles</h3>
          {dayTimes.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-6" data-testid="text-no-times">Sin horarios disponibles este día.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {dayTimes.map(t => {
                const isSel = selectedTime?.getTime() === t.getTime();
                return (
                  <button
                    key={t.toISOString()}
                    onClick={() => setSelectedTime(t)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${isSel ? "bg-primary text-white" : "bg-white/[0.03] hover:bg-white/[0.06] text-white/70"}`}
                    data-testid={`button-time-${t.toISOString()}`}
                  >
                    {t.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedTime && (
          <div className="rounded-2xl glass-card p-6 sm:p-8">
            <h2 className="font-bold mb-4">Tus datos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nombre completo *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} data-testid="input-customer-name" />
              <Input type="email" placeholder="Email *" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} data-testid="input-customer-email" />
              <Input placeholder="Teléfono (opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} data-testid="input-customer-phone" />
            </div>
            <Textarea placeholder="Notas (opcional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-3" data-testid="input-customer-notes" />
            <Button
              className="w-full mt-4"
              onClick={() => book.mutate()}
              disabled={book.isPending || !form.name || !form.email}
              data-testid="button-confirm-booking"
            >
              {book.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar reserva {slot.price && slot.requiresPayment ? `· ${formatMoney(slot.price, slot.currency || "CLP")}` : ""}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
