import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Flame, Activity, BookOpen, Calendar, Trophy, Award, Sparkles, Users, ClipboardCheck, ChevronDown, ChevronRight, Baby } from "lucide-react";
import { useMemo, useState } from "react";
import { toTitleCase } from "@/lib/format";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function Dashboard() {
  const { user, isAdmin, isMentor } = useAuth();
  const uid = user!.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_full_profile", { _id: uid });
      return (data as any[])?.[0] ?? null;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-muted-foreground font-normal">Welcome - </span>
          {profile?.nickname && <span className="text-primary">{profile.nickname} </span>}
          {toTitleCase(profile?.username || "")}
        </h1>
        {profile?.team && <span className="inline-block mt-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Team {profile.team}</span>}
      </div>

      {/* Everyone sees the user dashboard cards */}
      <UserCards uid={uid} />

      {isMentor && !isAdmin && <MentorDashboard uid={uid} />}
      {isAdmin && <AdminDashboard />}
    </div>
  );
}

/* ============================== USER ============================== */

function UserCards({ uid }: { uid: string }) {
  const { data: streak } = useQuery({
    queryKey: ["dash-streak", uid],
    queryFn: async () => {
      const { data } = await supabase.from("codex_entries").select("entry_date").eq("user_id", uid).order("entry_date", { ascending: false }).limit(30);
      if (!data?.length) return 0;
      let s = 0;
      const today = new Date(); today.setHours(0,0,0,0);
      for (let i = 0; i < data.length; i++) {
        const d = new Date(data[i].entry_date); d.setHours(0,0,0,0);
        const expected = new Date(today); expected.setDate(today.getDate() - i);
        if (d.getTime() === expected.getTime()) s++; else break;
      }
      return s;
    },
  });

  const { data: lastProgress } = useQuery({
    queryKey: ["dash-progress", uid],
    queryFn: async () => (await supabase.from("progress_tests").select("test_date,pushups").eq("user_id", uid).order("test_date",{ascending:false}).limit(1).maybeSingle()).data,
  });

  const { data: brainCount } = useQuery({
    queryKey: ["dash-brain", uid],
    queryFn: async () => (await supabase.from("book_log").select("id", { count: "exact", head: true }).eq("user_id", uid)).count ?? 0,
  });

  const { data: upcoming } = useQuery({
    queryKey: ["dash-upcoming"],
    queryFn: async () => (await supabase.from("events").select("id,title,event_date").gte("event_date", new Date().toISOString().slice(0,10)).order("event_date").limit(3)).data ?? [],
  });

  const { data: achievementsCount } = useQuery({
    queryKey: ["dash-ach", uid],
    queryFn: async () => (await supabase.from("achievement_attempts").select("id",{count:"exact",head:true}).eq("user_id", uid).eq("result","completed")).count ?? 0,
  });

  const { data: rank } = useQuery({
    queryKey: ["dash-rank", uid],
    queryFn: async () => {
      const { count } = await supabase.from("codex_entries").select("id",{count:"exact",head:true}).eq("user_id", uid);
      return count ?? 0;
    },
  });

  const { data: myAttendance } = useQuery({
    queryKey: ["dash-attendance", uid],
    queryFn: async () => (await supabase.from("class_attendees").select("id",{count:"exact",head:true}).eq("user_id", uid)).count ?? 0,
  });

  return (
    <>
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Codex" value={`${streak ?? 0} day streak`} href="/app/codex" tint="gold" />
        <StatCard icon={Activity} label="Progress" value={lastProgress ? `${lastProgress.pushups ?? "—"} pushups` : "Log first test"} href="/app/progress" />
        <StatCard icon={BookOpen} label="Brain Fitness" value={`${brainCount ?? 0} books`} href="/app/brain-fitness" />
        <StatCard icon={Calendar} label="Community" value={`${upcoming?.length ?? 0} upcoming`} href="/app/community" />
        <StatCard icon={Trophy} label="Leaderboard" value={`${rank ?? 0} entries`} href="/app/leaderboard" />
        <StatCard icon={Award} label="Achievements" value={`${achievementsCount ?? 0} done`} href="/app/achievements" />
        <StatCard icon={ClipboardCheck} label="Classes attended" value={`${myAttendance ?? 0}`} href="/app/mentors" />
        <Link to="/app/codex" className="rounded-xl p-5 text-primary-foreground hover:opacity-95 transition" style={{ background: "var(--gradient-primary)" }}>
          <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center mb-3"><Sparkles className="size-5" /></div>
          <p className="text-xs uppercase tracking-wide opacity-80">The 8 Principles</p>
          <p className="text-base font-semibold mt-1">Movement · Nutrition · Sleep · more</p>
        </Link>
      </section>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-display font-semibold text-lg mb-4">Upcoming events</h3>
        {!upcoming?.length && <p className="text-sm text-muted-foreground">No events scheduled yet.</p>}
        <ul className="space-y-3">
          {upcoming?.map((e: any) => (
            <li key={e.id} className="flex justify-between items-start border-b pb-3 last:border-0">
              <p className="font-medium">{e.title}</p>
              <span className="text-sm text-primary font-medium">{new Date(e.event_date).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, href, tint }: { icon: any; label: string; value: string; href: string; tint?: "gold" }) {
  return (
    <Link to={href} className="rounded-xl border bg-card p-5 hover:shadow-[var(--shadow-elegant)] transition-shadow">
      <div className={`size-10 rounded-lg flex items-center justify-center mb-3 ${tint === "gold" ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </Link>
  );
}

/* ============================== MENTOR ============================== */

type Range = "day" | "week" | "month" | "custom";

function rangeDates(r: Range, customFrom?: string, customTo?: string): { from: string; to: string } {
  const to = new Date(); to.setHours(0,0,0,0);
  const from = new Date(to);
  if (r === "day") {} 
  else if (r === "week") from.setDate(to.getDate() - 6);
  else if (r === "month") from.setDate(to.getDate() - 29);
  else if (r === "custom") return { from: customFrom || to.toISOString().slice(0,10), to: customTo || to.toISOString().slice(0,10) };
  return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
}

function MentorDashboard({ uid }: { uid: string }) {
  const [range, setRange] = useState<Range>("day");
  const [cFrom, setCFrom] = useState<string>(new Date().toISOString().slice(0,10));
  const [cTo, setCTo] = useState<string>(new Date().toISOString().slice(0,10));
  const { from, to } = useMemo(() => rangeDates(range, cFrom, cTo), [range, cFrom, cTo]);

  // Members assigned to this mentor
  const { data: members } = useQuery({
    queryKey: ["mentor-members", uid],
    queryFn: async () => (await supabase.from("profiles").select("id, username, nickname, full_name, group_id").eq("mentor_id", uid)).data ?? [],
  });

  const { data: groups } = useQuery({
    queryKey: ["all-groups"],
    queryFn: async () => (await supabase.from("gallery_groups").select("id,name").order("name")).data ?? [],
  });

  const groupName = (gid?: string | null) => groups?.find(g => g.id === gid)?.name ?? "Unassigned";
  const memberIds = (members ?? []).map(m => m.id);

  // Activity counts in range
  const { data: codex } = useQuery({
    queryKey: ["mentor-codex", uid, from, to],
    enabled: memberIds.length > 0,
    queryFn: async () => (await supabase.from("codex_entries").select("user_id, entry_date").in("user_id", memberIds).gte("entry_date", from).lte("entry_date", to)).data ?? [],
  });
  const { data: progress } = useQuery({
    queryKey: ["mentor-progress", uid, from, to],
    enabled: memberIds.length > 0,
    queryFn: async () => (await supabase.from("progress_tests").select("user_id, test_date").in("user_id", memberIds).gte("test_date", from).lte("test_date", to)).data ?? [],
  });
  const { data: brain } = useQuery({
    queryKey: ["mentor-brain", uid, from, to],
    enabled: memberIds.length > 0,
    queryFn: async () => (await supabase.from("book_log").select("user_id, created_at").in("user_id", memberIds).gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`)).data ?? [],
  });

  const { data: classes } = useQuery({
    queryKey: ["mentor-classes", uid, from, to],
    queryFn: async () => (await supabase.from("class_sessions").select("id, group_id, class_date").eq("recorded_by", uid).gte("class_date", from).lte("class_date", to).order("class_date",{ascending:false})).data ?? [],
  });

  const groupBuckets = useMemo(() => {
    const map = new Map<string, any[]>();
    (members ?? []).forEach(m => {
      const key = m.group_id || "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return map;
  }, [members]);

  const has = (arr: any[] | undefined, userId: string) => (arr ?? []).some(x => x.user_id === userId);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="size-5" /> Mentor Dashboard</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {(["day","week","month","custom"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 text-xs rounded-md border ${range===r?"bg-primary text-primary-foreground":""}`}>{r}</button>
          ))}
          {range === "custom" && (
            <>
              <input type="date" value={cFrom} onChange={e=>setCFrom(e.target.value)} className="text-xs border rounded px-2 py-1" />
              <input type="date" value={cTo} onChange={e=>setCTo(e.target.value)} className="text-xs border rounded px-2 py-1" />
            </>
          )}
        </div>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Groups</p>
          <p className="text-3xl font-bold mt-1">{groupBuckets.size}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Total members</p>
          <p className="text-3xl font-bold mt-1">{members?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Classes ({range})</p>
          <p className="text-3xl font-bold mt-1">{classes?.length ?? 0}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Members &amp; daily compliance — {from === to ? from : `${from} → ${to}`}</h3>
        {[...groupBuckets.entries()].map(([gid, ms]) => (
          <div key={gid}>
            <p className="text-sm font-semibold mb-2">{groupName(gid === "_none" ? null : gid)} <span className="text-muted-foreground font-normal">({ms.length})</span></p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-3">Member</th><th>Codex</th><th>Progress</th><th>Brain</th>
                </tr></thead>
                <tbody>
                  {ms.map(m => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{m.nickname ? `${m.nickname} ` : ""}{toTitleCase(m.username)}</td>
                      <td><Dot ok={has(codex, m.id)} /></td>
                      <td><Dot ok={has(progress, m.id)} /></td>
                      <td><Dot ok={has(brain, m.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!members?.length && <p className="text-sm text-muted-foreground">No members assigned to you yet.</p>}
      </div>
    </section>
  );
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block size-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />;
}

/* ============================== ADMIN ============================== */

function AdminDashboard() {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const { data: groups } = useQuery({
    queryKey: ["adm-groups"],
    queryFn: async () => (await supabase.from("gallery_groups").select("id,name").order("name")).data ?? [],
  });

  const { data: profiles } = useQuery({
    queryKey: ["adm-profiles"],
    queryFn: async () => (await supabase.rpc("list_all_profiles")).data ?? [],
  });

  const { data: codex } = useQuery({
    queryKey: ["adm-codex", date],
    queryFn: async () => (await supabase.from("codex_entries").select("user_id").eq("entry_date", date)).data ?? [],
  });
  const { data: progress } = useQuery({
    queryKey: ["adm-progress", date],
    queryFn: async () => (await supabase.from("progress_tests").select("user_id").eq("test_date", date)).data ?? [],
  });
  const { data: brain } = useQuery({
    queryKey: ["adm-brain", date],
    queryFn: async () => (await supabase.from("book_log").select("user_id").gte("created_at", `${date}T00:00:00Z`).lte("created_at", `${date}T23:59:59Z`)).data ?? [],
  });
  const { data: kids } = useQuery({
    queryKey: ["adm-kids", date],
    queryFn: async () => (await supabase.from("kids_daily").select("user_id").eq("entry_date", date)).data ?? [],
  });

  const groupMap = useMemo(() => {
    const m = new Map<string, any[]>();
    (profiles ?? []).forEach((p: any) => {
      const key = p.group_id || "_none";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(p);
    });
    return m;
  }, [profiles]);

  const pct = (members: any[], entries: any[] | undefined) => {
    if (!members.length) return 0;
    const did = new Set((entries ?? []).map(e => e.user_id));
    return Math.round((members.filter(m => did.has(m.id)).length / members.length) * 100);
  };

  const groupName = (gid: string) => gid === "_none" ? "Unassigned" : (groups?.find(g => g.id === gid)?.name ?? "—");

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm border rounded px-3 py-1" />
      </header>

      <div className="rounded-xl border bg-card divide-y">
        {[...groupMap.entries()].map(([gid, members]) => {
          const open = openGroup === gid;
          const did = {
            codex: new Set((codex ?? []).map(e => e.user_id)),
            progress: new Set((progress ?? []).map(e => e.user_id)),
            brain: new Set((brain ?? []).map(e => e.user_id)),
            kids: new Set((kids ?? []).map(e => e.user_id)),
          };
          return (
            <div key={gid}>
              <button onClick={() => setOpenGroup(open ? null : gid)} className="w-full flex items-center justify-between p-4 hover:bg-muted/40 text-left">
                <div className="flex items-center gap-2">
                  {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <span className="font-semibold">{groupName(gid)}</span>
                  <span className="text-xs text-muted-foreground">({members.length})</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <Pct label="Codex" value={pct(members, codex)} />
                  <Pct label="Progress" value={pct(members, progress)} />
                  <Pct label="Brain" value={pct(members, brain)} />
                  <Pct label="Kids" value={pct(members, kids)} icon={Baby} />
                </div>
              </button>
              {open && (
                <div className="bg-muted/20 p-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-3">Member</th><th>Codex</th><th>Progress</th><th>Brain</th><th>Kids</th>
                    </tr></thead>
                    <tbody>
                      {members.map((m: any) => (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{m.nickname ? `${m.nickname} ` : ""}{toTitleCase(m.username || m.full_name)}</td>
                          <td><Dot ok={did.codex.has(m.id)} /></td>
                          <td><Dot ok={did.progress.has(m.id)} /></td>
                          <td><Dot ok={did.brain.has(m.id)} /></td>
                          <td><Dot ok={did.kids.has(m.id)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        {!groupMap.size && <p className="p-4 text-sm text-muted-foreground">No data yet.</p>}
      </div>
    </section>
  );
}

function Pct({ label, value, icon: Icon }: { label: string; value: number; icon?: any }) {
  const color = value >= 70 ? "text-emerald-600" : value >= 30 ? "text-amber-600" : "text-rose-600";
  return (
    <span className="inline-flex items-center gap-1">
      {Icon && <Icon className="size-3" />}
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-semibold ${color}`}>{value}%</span>
    </span>
  );
}
