import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState, useMemo, useRef, type FormEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Download, Upload, Sparkles, Loader2 } from "lucide-react";
import { ocrProgressImage } from "@/lib/ocr.functions";

export const Route = createFileRoute("/app/progress")({ component: ProgressPage });

const METRICS = [
  { k: "pushups", label: "Pushups", unit: "reps", group: "Upper Body Strength", timed: false },
  { k: "plank_seconds", label: "Plank", unit: "sec", group: "Core Strength", timed: false },
  { k: "squats", label: "Squat Hold", unit: "sec", group: "Lower Body Strength", timed: false },
  { k: "run_100m_seconds", label: "100m Run", unit: "sec", group: "Anaerobic", timed: true, defaultUnit: "sec" as const },
  { k: "run_5k_seconds", label: "5k Run", unit: "sec", group: "Aerobic", timed: true, defaultUnit: "min" as const },
] as const;

type TimeUnit = "sec" | "min" | "hr";
const toSeconds = (v: number, u: TimeUnit) => u === "sec" ? v : u === "min" ? v * 60 : v * 3600;
const fromSeconds = (s: number, u: TimeUnit) => u === "sec" ? s : u === "min" ? s / 60 : s / 3600;

function ProgressPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const runOcr = useServerFn(ocrProgressImage);
  const [form, setForm] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, TimeUnit>>(() => {
    const u: Record<string, TimeUnit> = {};
    for (const m of METRICS) if (m.timed) u[m.k] = m.defaultUnit;
    return u;
  });
  const [month, setMonth] = useState<string>("all");
  const [ocrLoading, setOcrLoading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const { data: entries } = useQuery({
    queryKey: ["progress", uid],
    queryFn: async () => (await supabase.from("progress_tests").select("*").eq("user_id", uid).order("test_date")).data ?? [],
  });

  const filtered = useMemo(() => {
    if (month === "all") return entries ?? [];
    return (entries ?? []).filter((e: any) => e.test_date?.startsWith(month));
  }, [entries, month]);

  const monthOptions = useMemo(() => {
    const opts: string[] = [];
    const d = new Date();
    for (let i = 0; i < 12; i++) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      opts.push(m.toISOString().slice(0, 7));
    }
    return opts;
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = { user_id: uid, test_date: new Date().toISOString().slice(0,10) };
    for (const m of METRICS) {
      if (!form[m.k]) continue;
      const v = Number(form[m.k]);
      payload[m.k] = m.timed ? toSeconds(v, units[m.k]) : v;
    }
    const { error } = await supabase.from("progress_tests").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Entry logged");
    setForm({});
    qc.invalidateQueries({ queryKey: ["progress", uid] });
  };

  const exportCsv = () => {
    if (!filtered.length) { toast.error("No data to export"); return; }
    const headers = ["date", ...METRICS.map(m => m.k)];
    const rows = filtered.map((t: any) => [t.test_date, ...METRICS.map(x => t[x.k] ?? "")].join(","));
    const blob = new Blob([headers.join(",") + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `hfc-progress-${month}.csv`; a.click();
  };

  const downloadTemplate = () => {
    const headers = ["date", ...METRICS.map(m => m.k)];
    const sample = [new Date().toISOString().slice(0,10), 20, 60, 45, 16.5, 1500].join(",");
    const blob = new Blob([headers.join(",") + "\n" + sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "hfc-progress-template.csv"; a.click();
  };

  const importCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) { toast.error("Empty CSV"); return; }
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(l => {
      const vals = l.split(",");
      const row: any = { user_id: uid };
      headers.forEach((h, i) => {
        const v = vals[i]?.trim();
        if (!v) return;
        if (h === "date") row.test_date = v;
        else if (METRICS.find(m => m.k === h)) row[h] = Number(v);
      });
      return row;
    }).filter(r => r.test_date);
    if (!rows.length) { toast.error("No valid rows"); return; }
    const { error } = await supabase.from("progress_tests").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${rows.length} entries`);
    if (csvRef.current) csvRef.current.value = "";
    qc.invalidateQueries({ queryKey: ["progress", uid] });
  };

  const importImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setOcrLoading(true);
    try {
      const path = `${uid}/${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("progress-imports").upload(path, file);
      if (up.error) throw new Error(up.error.message);
      const { data: pub } = supabase.storage.from("progress-imports").getPublicUrl(path);
      const metrics = await runOcr({ data: { imageUrl: pub.publicUrl } });
      const next: Record<string, string> = { ...form };
      let found = 0;
      for (const [k, v] of Object.entries(metrics)) {
        if (v != null) { next[k] = String(v); found++; }
      }
      setForm(next);
      toast.success(found ? `Auto-filled ${found} metric${found > 1 ? "s" : ""} — review and save` : "No metrics detected in image");
    } catch (err: any) {
      toast.error(err.message ?? "OCR failed");
    } finally {
      setOcrLoading(false);
      if (imgRef.current) imgRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Progress Tracker</h1>
        <p className="text-muted-foreground mt-2">Monthly Performance Test — track your gains over time.</p>
      </header>

      <form onSubmit={submit} className="rounded-xl border bg-card p-6">
        <h2 className="font-display font-semibold mb-1">Log today's performance test</h2>
        <p className="text-xs text-muted-foreground mb-4">Record once a month for a comparable trend.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {METRICS.map((m) => (
            <div key={m.k}>
              <Label>
                {m.label}{" "}
                <span className="text-xs text-muted-foreground">({m.timed ? units[m.k] : m.unit})</span>
              </Label>
              <p className="text-[10px] text-muted-foreground mb-1">{m.group}</p>
              {m.timed ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    className="flex-1"
                    value={form[m.k] ?? ""}
                    onChange={(e) => setForm({ ...form, [m.k]: e.target.value })}
                  />
                  <Select value={units[m.k]} onValueChange={(v) => setUnits({ ...units, [m.k]: v as TimeUnit })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sec">sec</SelectItem>
                      <SelectItem value="min">min</SelectItem>
                      <SelectItem value="hr">hr</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Input
                  type="number"
                  step="any"
                  value={form[m.k] ?? ""}
                  onChange={(e) => setForm({ ...form, [m.k]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <Button type="submit" className="mt-4">Save entry</Button>
      </form>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Month</Label>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              {monthOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input ref={csvRef} type="file" accept=".csv" onChange={importCsv} className="hidden" />
          <input ref={imgRef} type="file" accept="image/*" onChange={importImage} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => csvRef.current?.click()}><Upload className="size-4" /> Import CSV</Button>
          <Button variant="outline" size="sm" disabled={ocrLoading} onClick={() => imgRef.current?.click()}>
            {ocrLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {ocrLoading ? "Scanning…" : "Scan image (AI)"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadTemplate}><Download className="size-4" /> Template</Button>
          <Button variant="outline" size="sm" onClick={exportCsv}><Download className="size-4" /> Export CSV</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {METRICS.map((m) => {
          const displayUnit = m.timed ? units[m.k] : m.unit;
          const data = filtered
            .filter((x: any) => x[m.k] != null)
            .map((x: any) => ({
              date: x.test_date,
              value: m.timed ? Number(fromSeconds(x[m.k], units[m.k]).toFixed(2)) : x[m.k],
            }));
          return (
            <div key={m.k} className="rounded-xl border bg-card p-4">
              <p className="font-medium mb-2">{m.label} <span className="text-xs text-muted-foreground">({displayUnit})</span></p>
              {data.length ? (
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={data}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground py-10 text-center">No data for this period</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
