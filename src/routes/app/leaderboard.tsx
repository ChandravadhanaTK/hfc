import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Trophy, Flame, BookOpen, Baby, Star, Award } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/app/leaderboard")({ component: Leader });

type Tab = "achievements" | "codex" | "progress" | "books" | "kids";

function Leader() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("achievements");
  const [codexFilter, setCodexFilter] = useState<string>("all");

  const { data: achievementsBoard } = useQuery({
    queryKey: ["lb-achievements"],
    queryFn: async () => {
      const { data } = await supabase.from("achievement_attempts").select("user_id");
      const scores: Record<string, number> = {};
      for (const a of data ?? []) scores[a.user_id] = (scores[a.user_id] ?? 0) + 1;
      return await joinProfiles(scores);
    },
  });

  const { data: codexBoard } = useQuery({
    queryKey: ["lb-codex", codexFilter],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - 30);
      const { data } = await supabase.from("codex_entries").select("user_id, movement, nutrition, sleep, hydration, mindfulness, learning, connection, gratitude").gte("entry_date", since.toISOString().slice(0,10));
      const scores: Record<string, number> = {};
      for (const e of data ?? []) {
        const c = ["movement","nutrition","sleep","hydration","mindfulness","learning","connection","gratitude"].filter(k => (e as any)[k]).length;
        scores[e.user_id] = (scores[e.user_id] ?? 0) + c;
      }
      return await joinProfiles(scores, codexFilter);
    },
  });

  const { data: progressBoard } = useQuery({
    queryKey: ["lb-progress"],
    queryFn: async () => {
      const { data } = await supabase.from("progress_tests").select("user_id, pushups, squats, plank_seconds, run_100m_seconds, run_5k_seconds");
      const scores: Record<string, number> = {};
      for (const r of data ?? []) {
        // higher reps/holds = better; lower run times = better (invert)
        const runScore = (r.run_100m_seconds ? 1000 / r.run_100m_seconds : 0) + (r.run_5k_seconds ? 10000 / r.run_5k_seconds : 0);
        const s = (r.pushups ?? 0) + (r.squats ?? 0) / 2 + (r.plank_seconds ?? 0) / 5 + runScore;
        scores[r.user_id] = Math.max(scores[r.user_id] ?? 0, s);
      }
      return await joinProfiles(scores);
    },
  });

  const { data: bookBoard } = useQuery({
    queryKey: ["lb-books"],
    queryFn: async () => {
      const { data } = await supabase.from("book_log").select("user_id, status");
      const scores: Record<string, number> = {};
      for (const b of data ?? []) if (b.status === "finished") scores[b.user_id] = (scores[b.user_id] ?? 0) + 1;
      return await joinProfiles(scores);
    },
  });

  const { data: kidsBoard } = useQuery({
    queryKey: ["lb-kids"],
    queryFn: async () => {
      const { data: stars } = await supabase.from("kids_stars").select("user_id, star_type");
      const byUser: Record<string, { gold: number; silver: number; blue: number }> = {};
      for (const s of stars ?? []) {
        byUser[s.user_id] ??= { gold: 0, silver: 0, blue: 0 };
        byUser[s.user_id][s.star_type as "gold"|"silver"|"blue"]++;
      }
      const scores: Record<string, number> = {};
      for (const [uid, v] of Object.entries(byUser)) scores[uid] = v.gold * 3 + v.silver * 2 + v.blue;
      const rows = await joinProfiles(scores);
      return rows.map(r => ({ ...r, stars: byUser[r.user_id as string] }));
    },
  });

  const tabs = [
    { k: "achievements", l: "Achievements", i: Award, d: achievementsBoard },
    { k: "codex", l: "Codex (30d)", i: Flame, d: codexBoard },
    { k: "progress", l: "Progress", i: Trophy, d: progressBoard },
    { k: "books", l: "Brain Fitness", i: BookOpen, d: bookBoard },
    { k: "kids", l: "Kids Stars", i: Baby, d: kidsBoard },
  ] as const;

  const active = tabs.find(t => t.k === tab)!;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Show up. Stand out.</p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k as Tab)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === t.k ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}>
            <t.i className="size-4" />{t.l}
          </button>
        ))}
      </div>

      {tab === "codex" && isAdmin && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter (admin):</span>
          <Select value={codexFilter} onValueChange={setCodexFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All training types</SelectItem>
              <SelectItem value="OT">Online (OT)</SelectItem>
              <SelectItem value="PT">Personal (PT)</SelectItem>
              <SelectItem value="KT">Kids (KT)</SelectItem>
              <SelectItem value="GT">Group (GT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="rounded-xl border bg-card divide-y">
        {(active.d ?? []).slice(0, 20).map((row: any, i: number) => (
          <div key={row.user_id} className="flex items-center gap-4 p-4">
            <div className={`size-10 rounded-full flex items-center justify-center font-bold ${i === 0 ? "bg-gold text-gold-foreground" : i < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>#{i + 1}</div>
            <div className="flex-1">
              <p className="font-semibold">{row.full_name || toTitleCase(row.username)}</p>
              <p className="text-xs text-muted-foreground">{row.training_type ? `${row.training_type}` : row.team ? `Team ${row.team}` : ""}</p>
            </div>
            {tab === "kids" && row.stars ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-0.5"><Star className="size-4 fill-gold text-gold" />{row.stars.gold}</span>
                <span className="flex items-center gap-0.5"><Star className="size-4 fill-muted-foreground text-muted-foreground" />{row.stars.silver}</span>
                <span className="flex items-center gap-0.5"><Star className="size-4 fill-blue-500 text-blue-500" />{row.stars.blue}</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-primary">{Math.round(row.score)}</p>
            )}
          </div>
        ))}
        {!active.d?.length && <p className="p-8 text-center text-muted-foreground">No data yet</p>}
      </div>
    </div>
  );
}

async function joinProfiles(scores: Record<string, number>, trainingType: string = "all") {
  const ids = Object.keys(scores);
  if (!ids.length) return [];
  let q = supabase.from("public_profiles").select("id, username, full_name, team, training_type").in("id", ids);
  if (trainingType !== "all") q = q.eq("training_type", trainingType);
  const { data: profs } = await q;
  return (profs ?? []).filter(p => p.id != null).map(p => ({ user_id: p.id as string, ...p, score: scores[p.id as string] })).sort((a, b) => b.score - a.score);
}
