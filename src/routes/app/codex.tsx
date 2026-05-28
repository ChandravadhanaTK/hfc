import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Flame, ThumbsUp, Moon, Frown, Droplet } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/codex")({ component: CodexPage });

// Ordered per HFC scoring: Sleep → Hydration → Nutrition → Exercise → Meditation → Punctuality → Reading → Reduce Screen Time
// Keys map to the existing codex_entries columns (movement = exercise, mindfulness = meditation,
// learning = reading, connection = punctuality, gratitude = reduce screen time).
const PRINCIPLES = [
  { key: "sleep",       label: "Sleep",             desc: "Recover deeply" },
  { key: "hydration",   label: "Hydration",         desc: "Drink mindfully" },
  { key: "nutrition",   label: "Nutrition",         desc: "Eat with intention" },
  { key: "movement",    label: "Exercise",          desc: "Train your body today" },
  { key: "mindfulness", label: "Meditation",        desc: "Breathe and observe" },
  { key: "connection",  label: "Punctuality",       desc: "Be on time, every time" },
  { key: "learning",    label: "Reading",           desc: "Read or study" },
  { key: "gratitude",   label: "Reduce Screen Time", desc: "Step away from the screen" },
] as const;

function CodexPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const today = new Date().toISOString().slice(0, 10);
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-gender", uid],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_full_profile", { _id: uid });
      const row = (data as any[])?.[0];
      return row ? { gender: row.gender, full_name: row.full_name, nickname: row.nickname } : null;
    },
  });

  const waterGoal = profile?.gender === "female" ? 3 : 4;

  const { data: entry } = useQuery({
    queryKey: ["codex", uid, today],
    queryFn: async () => (await supabase.from("codex_entries").select("*").eq("user_id", uid).eq("entry_date", today).maybeSingle()).data,
  });

  const { data: history } = useQuery({
    queryKey: ["codex-history", uid],
    queryFn: async () => (await supabase.from("codex_entries").select("*").eq("user_id", uid).order("entry_date", { ascending: false }).limit(60)).data ?? [],
  });

  const [form, setForm] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [sleepScore, setSleepScore] = useState(0);
  const [water, setWater] = useState("");

  useEffect(() => {
    if (entry) {
      const f: Record<string, boolean> = {};
      PRINCIPLES.forEach(p => { f[p.key] = !!(entry as any)[p.key]; });
      setForm(f);
      setNotes(entry.notes ?? "");
      setSleepScore((entry as any).sleep_score ?? 0);
      setWater(((entry as any).water_litres ?? "")?.toString() ?? "");
    }
  }, [entry]);

  const count = PRINCIPLES.filter(p => form[p.key]).length;
  const streak = computeStreak(history ?? []);
  const baseName = (profile?.full_name || "").trim().split(/\s+/)[0] || "Champion";
  const firstName = ((profile as any)?.nickname ? `${(profile as any).nickname} ${baseName}` : baseName).trim();
  const streakMessage = useMemo(() => {
    const msgs =
      streak >= 30 ? [`Legendary ${firstName}!`, `Unstoppable, ${firstName}!`, `${firstName}, you're on fire!`]
      : streak >= 14 ? [`Way to go, ${firstName}!`, `Keep it up, ${firstName}!`, `Strong streak, ${firstName}!`]
      : streak >= 7 ? [`Nice rhythm, ${firstName}!`, `Stay consistent, ${firstName}!`, `One week — proud of you, ${firstName}!`]
      : streak >= 3 ? [`Good momentum, ${firstName}!`, `Don't break the chain, ${firstName}!`]
      : streak >= 1 ? [`Great start, ${firstName}!`, `Show up tomorrow too, ${firstName}.`]
      : [`Let's begin today, ${firstName}.`, `Tap a principle to start your streak, ${firstName}.`];
    return msgs[new Date().getDate() % msgs.length];
  }, [streak, firstName]);

  const save = async () => {
    const payload: any = {
      user_id: uid, entry_date: today, notes,
      sleep_score: sleepScore || null,
      water_litres: water ? Number(water) : null,
      ...form,
    };
    const { error } = await supabase.from("codex_entries").upsert(payload, { onConflict: "user_id,entry_date" });
    if (error) { toast.error(error.message); return; }
    toast.success("Today's codex saved");
    qc.invalidateQueries({ queryKey: ["codex", uid] });
    qc.invalidateQueries({ queryKey: ["codex-history", uid] });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Daily Codex</h1>
        <p className="text-muted-foreground mt-2">Eight principles. One entry per day. Edit today as many times as you like.</p>
      </header>

      <div className="rounded-2xl p-6 text-primary-foreground flex items-center justify-between" style={{ background: "var(--gradient-primary)" }}>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-80">Current streak</p>
          <p className="text-5xl font-bold flex items-center gap-2 mt-2"><Flame className="size-10 text-gold" />{streak}</p>
          <p className="opacity-80 mt-1">{count}/8 today</p>
          <p className="mt-2 font-medium text-base">{streakMessage}</p>
        </div>
        <div className="text-right text-sm opacity-80">
          <p className="text-xs uppercase tracking-wider opacity-70">Entry date</p>
          <p className="font-mono text-base">{today}</p>
          <p className="mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PRINCIPLES.map((p) => (
          <label key={p.key} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form[p.key] ? "bg-primary/5 border-primary" : "bg-card hover:border-primary/40"}`}>
            <Checkbox checked={!!form[p.key]} onCheckedChange={(v) => setForm({ ...form, [p.key]: !!v })} />
            <div>
              <p className="font-semibold">{p.label}</p>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Sleep score */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold flex items-center gap-2"><Moon className="size-4" /> How did you sleep?</p>
            <p className="text-xs text-muted-foreground">Pick 1–7. Higher = better.</p>
          </div>
          <SleepFace score={sleepScore} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => {
            const n = i + 1;
            const active = sleepScore >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setSleepScore(sleepScore === n ? 0 : n)}
                className={`size-10 rounded-lg border flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${active ? "bg-primary text-primary-foreground border-primary animate-scale-in" : "bg-background hover:border-primary/50"}`}
                aria-label={`Sleep score ${n}`}
              >
                <ThumbsUp className="size-4" />
              </button>
            );
          })}
        </div>
        <p className="text-xs mt-2 text-muted-foreground">
          {sleepScore >= 6 && "Great recovery — keep it up."}
          {sleepScore === 5 && "Moderate — try winding down earlier."}
          {sleepScore > 0 && sleepScore <= 4 && "Not great — prioritize rest tonight."}
          {sleepScore === 0 && "Not logged yet."}
        </p>
      </div>

      {/* Hydration with animated character */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold flex items-center gap-2"><Droplet className="size-4 text-primary" /> Hydration</p>
            <p className="text-xs text-muted-foreground">
              Daily goal: <span className="font-medium">{waterGoal} L</span> ({profile?.gender === "female" ? "women" : "men"})
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{(Number(water) || 0).toFixed(1)} L</p>
            <p className="text-xs text-muted-foreground">{Math.min(100, Math.round(((Number(water) || 0) / waterGoal) * 100))}%</p>
          </div>
        </div>

        <HydrationCharacter litres={Number(water) || 0} />

        <div className="mt-4 space-y-2">
          <Slider
            value={[Math.min(8, Math.max(0, Number(water) || 0))]}
            min={0}
            max={8}
            step={0.25}
            onValueChange={(v) => setWater(String(v[0]))}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0L</span><span>2L</span><span>4L</span><span>6L</span><span>8L</span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, ((Number(water) || 0) / waterGoal) * 100)}%` }}
          />
        </div>
      </div>


      <div>
        <label className="text-sm font-medium mb-2 block">Reflection</label>
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="A note for future you…" />
      </div>

      <Button onClick={save} size="lg" className="w-full sm:w-auto">
        {entry ? "Update today's codex" : "Save today's codex"}
      </Button>

      <section>
        <h2 className="font-display font-semibold text-xl mb-4">Last 30 days</h2>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => {
            const date = new Date(); date.setDate(date.getDate() - (29 - i));
            const ds = date.toISOString().slice(0, 10);
            const h = history?.find((e: any) => e.entry_date === ds);
            const c = h ? PRINCIPLES.filter(p => (h as any)[p.key]).length : 0;
            const completed = c >= 6;
            const cls = !h
              ? "bg-muted"
              : completed
                ? "bg-green-500 text-white"
                : c < 3 ? "bg-primary/20" : "bg-primary/50";
            return (
              <div
                key={ds}
                title={`${ds}: ${c}/8`}
                className={`aspect-square rounded text-[9px] flex items-center justify-center font-medium ${cls}`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Green = day completed (6+ principles). Dates shown for each entry.</p>
      </section>
    </div>
  );
}

function SleepFace({ score }: { score: number }) {
  if (score === 0) return <span className="text-2xl text-muted-foreground">—</span>;
  if (score >= 6) return <span className="text-3xl animate-scale-in">😄</span>;
  if (score >= 4) return <Moon className="size-7 text-blue-400 animate-pulse" />;
  return <Frown className="size-7 text-destructive animate-pulse" />;
}

function computeStreak(entries: any[]) {
  if (!entries.length) return 0;
  let s = 0;
  const today = new Date(); today.setHours(0,0,0,0);
  for (let i = 0; i < entries.length; i++) {
    const d = new Date(entries[i].entry_date); d.setHours(0,0,0,0);
    const exp = new Date(today); exp.setDate(today.getDate() - i);
    if (d.getTime() === exp.getTime()) s++; else break;
  }
  return s;
}

function HydrationCharacter({ litres }: { litres: number }) {
  // 6 tiers: dehydrated → dull → ok → fit → strong → muscular
  const tier =
    litres < 0.5 ? 0
    : litres < 1.5 ? 1
    : litres < 2.5 ? 2
    : litres < 3.5 ? 3
    : litres < 4.5 ? 4
    : 5;

  const tiers = [
    { emoji: "🥵", label: "Dehydrated — drink up!", body: 28, color: "oklch(0.65 0.22 30)", glow: 0.1 },
    { emoji: "😪", label: "A bit dull — more water", body: 34, color: "oklch(0.70 0.10 60)", glow: 0.15 },
    { emoji: "🙂", label: "Doing OK — keep sipping", body: 42, color: "oklch(0.74 0.14 130)", glow: 0.25 },
    { emoji: "😎", label: "Feeling fit", body: 52, color: "oklch(0.74 0.20 130)", glow: 0.4 },
    { emoji: "💪", label: "Strong & hydrated", body: 62, color: "oklch(0.74 0.22 130)", glow: 0.55 },
    { emoji: "🏆", label: "Muscular legend!", body: 72, color: "oklch(0.78 0.24 130)", glow: 0.7 },
  ][tier];

  return (
    <div className="flex items-center gap-6 p-4 rounded-xl bg-muted/40 transition-all duration-500">
      <div className="relative flex items-end justify-center w-24 h-32 shrink-0">
        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
          style={{ background: tiers.color, opacity: tiers.glow }}
        />
        {/* Head */}
        <div className="absolute top-0 size-10 rounded-full bg-[oklch(0.78_0.06_60)] flex items-center justify-center text-xl shadow-md">
          {tiers.emoji}
        </div>
        {/* Body / torso — width grows with hydration */}
        <div
          className="rounded-2xl rounded-b-md transition-all duration-700"
          style={{
            width: `${tiers.body}px`,
            height: "70px",
            background: `linear-gradient(180deg, ${tiers.color}, oklch(0.55 0.18 130))`,
            marginBottom: "4px",
            boxShadow: `0 4px 20px -4px ${tiers.color}`,
          }}
        />
        {/* Arms — flex when strong */}
        {tier >= 3 && (
          <>
            <div
              className="absolute bottom-8 -left-1 w-3 rounded-full transition-all duration-700"
              style={{ height: `${30 + tier * 4}px`, background: tiers.color, transform: tier >= 4 ? "rotate(-25deg)" : "rotate(-10deg)" }}
            />
            <div
              className="absolute bottom-8 -right-1 w-3 rounded-full transition-all duration-700"
              style={{ height: `${30 + tier * 4}px`, background: tiers.color, transform: tier >= 4 ? "rotate(25deg)" : "rotate(10deg)" }}
            />
          </>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{tiers.label}</p>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors duration-500 ${i <= tier ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Slide below to update — your hero grows stronger with every litre.</p>
      </div>
    </div>
  );
}
