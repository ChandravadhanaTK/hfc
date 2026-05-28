import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Baby, Star, Clock, Dumbbell, Droplet, Bed, BedDouble } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/kids")({ component: KidsPage });

type DailyForm = {
  entry_date: string;
  punctual: boolean;
  exercise_rating: string;
  water_litres: string;
  wake_time: string;
  sleep_time: string;
  slept_8h: boolean;
  made_bed: boolean;
  notes: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

function KidsPage() {
  const { user, isAdmin, roles } = useAuth();
  const isMentor = roles.includes("mentor");
  const qc = useQueryClient();
  const [form, setForm] = useState<DailyForm>({
    entry_date: todayStr(),
    punctual: false,
    exercise_rating: "3",
    water_litres: "",
    wake_time: "",
    sleep_time: "",
    slept_8h: false,
    made_bed: false,
    notes: "",
  });

  const { data: entries } = useQuery({
    queryKey: ["kids-daily", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_daily")
        .select("*")
        .eq("user_id", user!.id)
        .order("entry_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
  });

  const { data: myStars } = useQuery({
    queryKey: ["my-stars", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_stars")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        user_id: user!.id,
        entry_date: form.entry_date,
        punctual: form.punctual,
        exercise_rating: form.exercise_rating ? Number(form.exercise_rating) : null,
        water_litres: form.water_litres ? Number(form.water_litres) : null,
        wake_time: form.wake_time || null,
        sleep_time: form.sleep_time || null,
        slept_8h: form.slept_8h,
        made_bed: form.made_bed,
        notes: form.notes.trim() || null,
      };
      const { error } = await supabase.from("kids_daily").upsert(payload, { onConflict: "user_id,entry_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved today's check-in");
      qc.invalidateQueries({ queryKey: ["kids-daily"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const starCounts = useMemo(() => {
    const c = { gold: 0, silver: 0, blue: 0 };
    for (const s of myStars ?? []) c[s.star_type as "gold" | "silver" | "blue"]++;
    return c;
  }, [myStars]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold flex items-center gap-2"><Baby className="size-8" /> Kids</h1>
        <p className="text-muted-foreground mt-2">Punctuality, exercise, discipline — earn your stars.</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StarCard label="Gold" count={starCounts.gold} className="text-gold fill-gold" />
        <StarCard label="Silver" count={starCounts.silver} className="text-muted-foreground fill-muted-foreground" />
        <StarCard label="Blue" count={starCounts.blue} className="text-blue-500 fill-blue-500" />
      </div>

      <section className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">Daily check-in</h2>
          <div>
            <Label htmlFor="entry_date" className="text-xs">Date</Label>
            <Input id="entry_date" type="date" className="w-44" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
          </div>
        </div>

        <Section icon={Clock} title="Punctuality">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={form.punctual} onCheckedChange={(v) => setForm({ ...form, punctual: !!v })} />
            On time today
          </label>
        </Section>

        <Section icon={Dumbbell} title="Exercise & Execution">
          <Label className="text-xs">Rating (1–5)</Label>
          <Select value={form.exercise_rating} onValueChange={(v) => setForm({ ...form, exercise_rating: v })}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </Section>

        <Section icon={Droplet} title="Discipline">
          <div className="space-y-4">
            <div>
              <Label htmlFor="water" className="text-xs flex items-center gap-1"><Droplet className="size-3" /> Water (target 2.5L)</Label>
              <Input id="water" type="number" step="0.1" placeholder="2.5" value={form.water_litres} onChange={(e) => setForm({ ...form, water_litres: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wake" className="text-xs">Wake-up time</Label>
                <Input id="wake" type="time" value={form.wake_time} onChange={(e) => setForm({ ...form, wake_time: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="sleep" className="text-xs">Sleep time</Label>
                <Input id="sleep" type="time" value={form.sleep_time} onChange={(e) => setForm({ ...form, sleep_time: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.slept_8h} onCheckedChange={(v) => setForm({ ...form, slept_8h: !!v })} />
              <BedDouble className="size-4" /> 8 hours of sleep
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={form.made_bed} onCheckedChange={(v) => setForm({ ...form, made_bed: !!v })} />
              <Bed className="size-4" /> Made the bed
            </label>
            <p className="text-xs text-muted-foreground">Tip: keep wake-up and sleep times consistent every day.</p>
          </div>
        </Section>

        <div>
          <Label htmlFor="notes" className="text-xs">Notes</Label>
          <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save check-in"}
        </Button>
      </section>

      {(isAdmin || isMentor) && <AwardStarCard />}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Recent check-ins</h2>
        {!entries?.length && <p className="text-sm text-muted-foreground">No entries yet.</p>}
        <div className="rounded-xl border bg-card divide-y">
          {entries?.map((e) => (
            <div key={e.id} className="p-4 text-sm flex flex-wrap gap-x-4 gap-y-1">
              <span className="font-semibold w-24">{e.entry_date}</span>
              <span className={e.punctual ? "text-primary" : "text-muted-foreground"}>{e.punctual ? "✓" : "✗"} Punctual</span>
              <span>Exec {e.exercise_rating ?? "—"}/5</span>
              <span>{e.water_litres ?? "—"}L</span>
              <span>Wake {e.wake_time ?? "—"}</span>
              <span>Sleep {e.sleep_time ?? "—"}</span>
              <span className={e.slept_8h ? "text-primary" : "text-muted-foreground"}>{e.slept_8h ? "✓" : "✗"} 8h</span>
              <span className={e.made_bed ? "text-primary" : "text-muted-foreground"}>{e.made_bed ? "✓" : "✗"} Bed</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground"><Icon className="size-4" />{title}</h3>
      <div>{children}</div>
    </div>
  );
}

function StarCard({ label, count, className }: { label: string; count: number; className: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
      <Star className={`size-8 ${className}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label} stars</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </div>
  );
}

function AwardStarCard() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [starType, setStarType] = useState("gold");
  const [reason, setReason] = useState("");

  const { data: kids } = useQuery({
    queryKey: ["kids-list"],
    queryFn: async () => {
      const { data } = await supabase.from("public_profiles").select("id, full_name, username, training_type").eq("training_type", "KT");
      return data ?? [];
    },
  });

  const award = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Pick a kid");
      const { error } = await supabase.from("kids_stars").insert({ user_id: userId, star_type: starType, reason: reason || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Star awarded");
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-stars"] });
      qc.invalidateQueries({ queryKey: ["lb-kids"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <section className="rounded-xl border bg-card p-6 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2"><Star className="size-5 text-gold fill-gold" /> Award a star (staff)</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Kid</Label>
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger><SelectValue placeholder="Pick a kid" /></SelectTrigger>
            <SelectContent>
              {kids?.filter(k => k.id != null).map((k) => <SelectItem key={k.id!} value={k.id!}>{k.full_name || toTitleCase(k.username)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Star</Label>
          <Select value={starType} onValueChange={setStarType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Reason</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why?" />
        </div>
      </div>
      <Button onClick={() => award.mutate()} disabled={award.isPending}>Award</Button>
    </section>
  );
}
