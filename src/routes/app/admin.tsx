import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, TrendingUp, UserPlus, IndianRupee, Calendar, Activity, Clock, Download, LogIn } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/app/admin")({ component: AdminDashboard });

function AdminDashboard() {
  const { isAdmin, isMentor, loading, rolesLoading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !rolesLoading && !isAdmin && !isMentor) nav({ to: "/app" });
  }, [loading, rolesLoading, isAdmin, isMentor, nav]);

  if (loading || rolesLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin && !isMentor) return null;

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_all_profiles");
      return (data as any[]) ?? [];
    },
  });
  const { data: payments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => (await supabase.from("payments").select("*")).data ?? [],
  });
  const { data: attendance } = useQuery({
    queryKey: ["admin-attendance"],
    queryFn: async () => (await supabase.from("attendance").select("*").gte("class_date", monthsAgo(1))).data ?? [],
  });
  const { data: reviews } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const total = profiles?.length ?? 0;
  const newThisMonth = profiles?.filter(p => new Date(p.created_at) > new Date(monthsAgo(1))).length ?? 0;
  const revenue = payments?.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const revenueByType: Record<string, number> = {};
  for (const p of payments ?? []) if (p.status === "paid") revenueByType[p.training_type ?? "—"] = (revenueByType[p.training_type ?? "—"] ?? 0) + Number(p.amount);
  const presentCount = attendance?.filter(a => a.present).length ?? 0;
  const nsr = attendance?.length ? Math.round((1 - presentCount / attendance.length) * 100) : 0;

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: dayAtt } = useQuery({
    queryKey: ["att-day", date],
    queryFn: async () => (await supabase.from("attendance").select("user_id, present").eq("class_date", date)).data ?? [],
  });
  const attMap = new Map(dayAtt?.map(a => [a.user_id, a.present]));

  const mark = async (user_id: string, present: boolean) => {
    const { error } = await supabase.from("attendance").upsert({ user_id, class_date: date, present }, { onConflict: "user_id,class_date" });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["att-day", date] });
  };

  if (loading || (!isAdmin && !isMentor)) return null;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-gold font-semibold">Admin Panel</p>
        <h1 className="text-4xl font-bold">Operations</h1>
      </header>

      <Tabs defaultValue="overview">
        <TabsList className="h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="monitoring">User Monitoring &amp; Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Metric icon={Users} label="Total members" value={total} />
            <Metric icon={UserPlus} label="New this month" value={newThisMonth} />
            <Metric icon={IndianRupee} label="Revenue (all-time)" value={`₹${revenue.toLocaleString()}`} />
            <Metric icon={TrendingUp} label="No-show rate" value={`${nsr}%`} />
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-display font-semibold mb-4">Revenue by training</h2>
            <div className="grid grid-cols-4 gap-3">
              {["OT", "PT", "PF", "GT"].map(t => (
                <div key={t} className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-xs uppercase">{t}</p>
                  <p className="text-xl font-bold mt-1">₹{(revenueByType[t] ?? 0).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-display font-semibold mb-4">Recent TTV reviews</h2>
            <div className="space-y-3">
              {reviews?.slice(0, 8).map(r => (
                <div key={r.id} className="border-b last:border-0 pb-2">
                  <p className="text-sm"><span className="font-medium">{r.stage}</span> — {"⭐".repeat(r.rating ?? 0)}</p>
                  {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                </div>
              ))}
              {!reviews?.length && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4 mt-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-display font-semibold flex items-center gap-2"><Calendar className="size-5" /> Attendance</h2>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-md h-9 px-3 bg-background text-sm" />
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {profiles?.map(p => (
                <label key={p.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/30 px-2 rounded">
                  <Checkbox checked={!!attMap.get(p.id)} onCheckedChange={(v) => mark(p.id, !!v)} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{p.full_name || toTitleCase(p.username)}</p>
                    <p className="text-xs text-muted-foreground">Team {p.team ?? "—"}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-display font-semibold mb-4">Members</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {profiles?.map(p => (
                <div key={p.id} className="flex justify-between items-center text-sm py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{p.full_name || toTitleCase(p.username)}</p>
                    <p className="text-xs text-muted-foreground">{p.team ?? "—"} • joined {new Date(p.joining_date ?? p.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => promoteToMentor(p.id, qc)}>Make mentor</Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <MonitoringTab profiles={profiles ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MonitoringTab({ profiles }: { profiles: any[] }) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const since = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - range); return d.toISOString();
  }, [range]);

  const { data: sessions } = useQuery({
    queryKey: ["mon-sessions", range],
    queryFn: async () => (await supabase.from("user_sessions").select("*").gte("started_at", since).order("started_at", { ascending: false })).data ?? [],
  });

  const { data: events } = useQuery({
    queryKey: ["mon-events", range],
    queryFn: async () => (await supabase.from("feature_events").select("*").gte("occurred_at", since)).data ?? [],
  });

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) m.set(p.id, p.full_name || toTitleCase(p.username));
    return m;
  }, [profiles]);

  // Login counts per day
  const loginsByDay = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const s of sessions ?? []) {
      const k = (s.started_at as string).slice(0, 10);
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(s.user_id);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, set]) => ({ date: date.slice(5), users: set.size, sessions: (sessions ?? []).filter(s => (s.started_at as string).slice(0, 10) === date).length }));
  }, [sessions]);

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); })();
  const monthAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();
  const dauUsers = new Set((sessions ?? []).filter(s => (s.started_at as string).slice(0, 10) === today).map(s => s.user_id)).size;
  const wauUsers = new Set((sessions ?? []).filter(s => (s.started_at as string).slice(0, 10) >= weekAgo).map(s => s.user_id)).size;
  const mauUsers = new Set((sessions ?? []).filter(s => (s.started_at as string).slice(0, 10) >= monthAgo).map(s => s.user_id)).size;

  // Avg session duration
  const durations = (sessions ?? []).map(s => s.duration_seconds ?? 0).filter(d => d > 0);
  const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  const totalDur = durations.reduce((a, b) => a + b, 0);

  // Screen usage
  const screenCounts: Record<string, number> = {};
  for (const e of events ?? []) if (e.feature === "screen_view") screenCounts[e.screen] = (screenCounts[e.screen] ?? 0) + 1;
  const screenData = Object.entries(screenCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Feature usage (non-screen-view)
  const featureCounts: Record<string, number> = {};
  for (const e of events ?? []) if (e.feature && e.feature !== "screen_view") featureCounts[e.feature] = (featureCounts[e.feature] ?? 0) + 1;
  const featureData = Object.entries(featureCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Peak login hour
  const hourCounts: number[] = Array(24).fill(0);
  for (const s of sessions ?? []) hourCounts[new Date(s.started_at as string).getHours()]++;
  const hourData = hourCounts.map((c, h) => ({ hour: `${h}:00`, logins: c }));
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Per-user table
  const perUser = useMemo(() => {
    const map = new Map<string, { user_id: string; logins: number; total_sec: number; events: number; last: string }>();
    for (const s of sessions ?? []) {
      const r = map.get(s.user_id) ?? { user_id: s.user_id, logins: 0, total_sec: 0, events: 0, last: s.started_at as string };
      r.logins++;
      r.total_sec += s.duration_seconds ?? 0;
      if ((s.started_at as string) > r.last) r.last = s.started_at as string;
      map.set(s.user_id, r);
    }
    for (const e of events ?? []) {
      const r = map.get(e.user_id) ?? { user_id: e.user_id, logins: 0, total_sec: 0, events: 0, last: e.occurred_at as string };
      r.events++;
      map.set(e.user_id, r);
    }
    return Array.from(map.values()).sort((a, b) => b.logins - a.logins);
  }, [sessions, events]);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--gold, 45 90% 50%))", "#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#84cc16", "#f97316", "#06b6d4"];

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows.length) { toast.error("Nothing to export"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          {[7, 30, 90].map(n => (
            <Button key={n} size="sm" variant={range === n ? "default" : "outline"} onClick={() => setRange(n as 7 | 30 | 90)}>
              Last {n} days
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => exportCSV(perUser.map(r => ({ user: nameById.get(r.user_id) ?? r.user_id, logins: r.logins, total_minutes: Math.round(r.total_sec / 60), events: r.events, last_seen: r.last })), `user-activity-${range}d.csv`)}>
            <Download className="size-4 mr-1" /> User activity
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportCSV([...screenData.map(s => ({ type: "screen", name: s.name, count: s.value })), ...featureData.map(f => ({ type: "feature", name: f.name, count: f.value }))], `usage-${range}d.csv`)}>
            <Download className="size-4 mr-1" /> Usage report
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric icon={LogIn} label="DAU (today)" value={dauUsers} />
        <Metric icon={Users} label="WAU (7d)" value={wauUsers} />
        <Metric icon={Activity} label="MAU (30d)" value={mauUsers} />
        <Metric icon={Clock} label="Avg session" value={fmtDur(avgDur)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display font-semibold mb-1">Login activity</h3>
          <p className="text-xs text-muted-foreground mb-4">Unique users + sessions per day</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={loginsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="sessions" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display font-semibold mb-1">Peak login hours</h3>
          <p className="text-xs text-muted-foreground mb-4">Busiest hour: <span className="font-semibold text-foreground">{peakHour}:00</span></p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={2} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="logins" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display font-semibold mb-1">Most-used screens</h3>
          <p className="text-xs text-muted-foreground mb-4">Views over last {range} days</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={screenData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-display font-semibold mb-1">Feature frequency</h3>
          <p className="text-xs text-muted-foreground mb-4">Codex submits, chat sends, progress logs, etc.</p>
          {featureData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={featureData} dataKey="value" nameKey="name" outerRadius={90} label={(d) => d.name}>
                  {featureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No feature events tracked yet. They'll appear once users interact with codex, chat, progress, etc.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-semibold">Per-user activity</h3>
          <p className="text-xs text-muted-foreground">Total time on platform: {fmtDur(totalDur)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">User</th>
                <th className="text-right py-2">Logins</th>
                <th className="text-right py-2">Total time</th>
                <th className="text-right py-2">Events</th>
                <th className="text-right py-2">Last seen</th>
              </tr>
            </thead>
            <tbody>
              {perUser.slice(0, 50).map(r => (
                <tr key={r.user_id} className="border-b last:border-0">
                  <td className="py-2">{nameById.get(r.user_id) ?? r.user_id.slice(0, 8)}</td>
                  <td className="text-right">{r.logins}</td>
                  <td className="text-right">{fmtDur(r.total_sec)}</td>
                  <td className="text-right">{r.events}</td>
                  <td className="text-right text-muted-foreground">{new Date(r.last).toLocaleString()}</td>
                </tr>
              ))}
              {!perUser.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No session data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function fmtDur(sec: number) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Icon className="size-5 text-primary mb-3" />
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

async function promoteToMentor(user_id: string, qc: any) {
  const { error } = await supabase.from("user_roles").insert({ user_id, role: "mentor" });
  if (error) { toast.error(error.message); return; }
  toast.success("Promoted to mentor");
  qc.invalidateQueries();
}

function monthsAgo(n: number) {
  const d = new Date(); d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}
