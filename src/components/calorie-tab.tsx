import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Camera, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { estimateCalories } from "@/lib/calorie.functions";

export default function CalorieTab() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [form, setForm] = useState({ meal_name: "", calories: "", photo_url: "", notes: "" });
  const analyze = useServerFn(estimateCalories);

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => (await supabase.rpc("get_full_profile", { _id: uid })).data?.[0] ?? null,
  });

  const { data: logs } = useQuery({
    queryKey: ["calorie-log", uid],
    queryFn: async () => (await supabase.from("calorie_log").select("*").eq("user_id", uid).order("eaten_at", { ascending: false })).data ?? [],
  });

  // Daily target via BMR * 1.4 if profile is filled
  const weight = profile?.weight_kg ?? 0;
  const height = profile?.height_cm ?? 0;
  const age = 30;
  const bmr = weight && height ? 10 * weight + 6.25 * height - 5 * age + 5 : 0;
  const dailyTarget = bmr ? Math.round(bmr * 1.4) : 2000;

  const today = new Date().toDateString();
  const todayLogs = logs?.filter(l => new Date(l.eaten_at).toDateString() === today) ?? [];
  const todayTotal = todayLogs.reduce((s, l) => s + Number(l.calories || 0), 0);

  const onPhoto = async (file: File) => {
    setAnalyzing(true);
    try {
      const path = `${uid}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("health-uploads").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("health-uploads").getPublicUrl(path);
      setForm(f => ({ ...f, photo_url: pub.publicUrl }));

      try {
        const result = await analyze({ data: { imageUrl: pub.publicUrl } });
        setForm(f => ({ ...f, meal_name: result.meal, calories: String(result.calories) }));
        toast.success("Analyzed!");
      } catch (err: any) {
        toast.message(err?.message ?? "Photo uploaded. Enter details manually.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("calorie_log").insert({
      user_id: uid,
      meal_name: form.meal_name,
      calories: Number(form.calories),
      photo_url: form.photo_url || null,
      notes: form.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Logged");
    setForm({ meal_name: "", calories: "", photo_url: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["calorie-log", uid] });
  };

  const del = async (id: string) => {
    await supabase.from("calorie_log").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["calorie-log", uid] });
  };

  const pct = Math.min(100, Math.round((todayTotal / dailyTarget) * 100));

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-display font-semibold text-lg">Today</h2>
          <p className="text-sm text-muted-foreground">{todayTotal} / {dailyTarget} kcal</p>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{dailyTarget - todayTotal > 0 ? `${dailyTarget - todayTotal} kcal remaining` : "Daily target reached"}</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-display font-semibold text-lg">Add meal</h2>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={analyzing}>
            <Camera className="w-4 h-4 mr-2" />{analyzing ? "Analyzing…" : "Take / Upload photo"}
          </Button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); }} />
          {form.photo_url && <img src={form.photo_url} alt="meal" className="w-16 h-16 rounded object-cover" />}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Meal name</Label><Input value={form.meal_name} onChange={e => setForm({ ...form, meal_name: e.target.value })} required /></div>
          <div><Label>Calories (kcal)</Label><Input type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} required /></div>
          <div className="sm:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <Button type="submit">Log meal</Button>
      </form>

      <div>
        <h2 className="font-display font-semibold text-lg mb-3">History</h2>
        <div className="rounded-xl border bg-card divide-y">
          {logs?.map(l => (
            <div key={l.id} className="p-4 flex items-center gap-3">
              {l.photo_url && <img src={l.photo_url} alt="" className="w-12 h-12 rounded object-cover" />}
              <div className="flex-1">
                <p className="font-medium">{l.meal_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(l.eaten_at).toLocaleString()}</p>
              </div>
              <p className="text-sm font-semibold">{l.calories} kcal</p>
              <Button size="icon" variant="ghost" onClick={() => del(l.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
          {!logs?.length && <p className="p-6 text-center text-muted-foreground text-sm">No meals logged yet.</p>}
        </div>
      </div>
    </div>
  );
}
