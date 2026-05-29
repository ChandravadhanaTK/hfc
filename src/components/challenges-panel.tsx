import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Target, CheckCircle2 } from "lucide-react";

const CHALLENGE_BADGES: Array<{ code: string; min: number }> = [
  { code: "first_challenge", min: 1 },
  { code: "five_challenges", min: 5 },
  { code: "ten_challenges", min: 10 },
];

export function ChallengesPanel() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [completeFor, setCompleteFor] = useState<string | null>(null);
  const [completeVal, setCompleteVal] = useState("");
  const [form, setForm] = useState({ title: "", description: "", metric: "", target_value: "", target_unit: "", deadline: "", source: "user" });

  const { data: challenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => (await supabase.from("challenges").select("*, challenge_completions(id, user_id, value, completed_at)").order("created_at", { ascending: false })).data ?? [],
  });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: form.title,
      description: form.description || null,
      metric: form.metric || null,
      target_value: form.target_value ? Number(form.target_value) : null,
      target_unit: form.target_unit || null,
      deadline: form.deadline || null,
      source: isAdmin && form.source === "admin" ? "admin" : "user",
      created_by: user!.id,
    };
    const { error } = await supabase.from("challenges").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge created");
    setOpen(false);
    setForm({ title: "", description: "", metric: "", target_value: "", target_unit: "", deadline: "", source: "user" });
    qc.invalidateQueries({ queryKey: ["challenges"] });
  };

  const complete = async (id: string) => {
    const { error } = await supabase.from("challenge_completions").insert({
      challenge_id: id, user_id: user!.id,
      value: completeVal ? Number(completeVal) : null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Challenge completed! 🎯");
    setCompleteFor(null); setCompleteVal("");
    qc.invalidateQueries({ queryKey: ["challenges"] });

    try {
      const { count } = await supabase.from("challenge_completions").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      const total = count ?? 0;
      const earnedCodes = CHALLENGE_BADGES.filter(b => total >= b.min).map(b => b.code);
      if (earnedCodes.length) {
        const { data: bdgs } = await supabase.from("badges").select("id, code, name").in("code", earnedCodes);
        for (const b of bdgs ?? []) {
          const { error: bErr } = await supabase.from("user_badges").insert({ user_id: user!.id, badge_id: b.id });
          if (!bErr) toast.success(`Badge earned: ${b.name}`);
        }
        qc.invalidateQueries({ queryKey: ["my-badges"] });
      }
    } catch { /* non-fatal */ }
  };

 return (
  <div 
    className="space-y-4"
    style={{ animation: "panelReveal 0.5s ease-out forwards" }}
  >

    <h2 style={{
      fontSize: "1.8rem",
      fontWeight: 900,
      color: "#ffffff",
      letterSpacing: "-0.5px",
      display: "flex",
      alignItems: "center",
      gap: "0.6rem",
    }}>
      <span style={{ color: "#00E676" }}>⚡</span> Active Challenges
    </h2>

    <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4" /> New challenge</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create challenge</DialogTitle></DialogHeader>
            <form onSubmit={create} className="space-y-3">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Run 5k in 25 minutes" required /></div>
              <div><Label>Metric</Label><Input value={form.metric} onChange={e => setForm({...form, metric: e.target.value})} placeholder="5k run / squats / plank" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Target</Label><Input type="number" step="0.01" value={form.target_value} onChange={e => setForm({...form, target_value: e.target.value})} placeholder="25" /></div>
                <div><Label>Unit</Label><Input value={form.target_unit} onChange={e => setForm({...form, target_unit: e.target.value})} placeholder="min / reps / sec" /></div>
              </div>
              <div><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              {isAdmin && (
                <div>
                  <Label>Source</Label>
                  <select className="w-full border rounded-md h-10 px-3 bg-background" value={form.source} onChange={e => setForm({...form, source: e.target.value})}>
                    <option value="user">User</option>
                    <option value="admin">Admin challenge</option>
                  </select>
                </div>
              )}
              <Button type="submit" className="w-full">Post</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {challenges?.map((c: any) => {
          const done = c.challenge_completions?.find((x: any) => x.user_id === user!.id);
          return (
            <div key={c.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${done ? "bg-gold text-gold-foreground" : c.source === "admin" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Target className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{c.title}</h3>
                    {c.source === "admin" && <span className="text-[10px] uppercase font-semibold tracking-wider text-accent-foreground bg-accent px-2 py-0.5 rounded">Admin</span>}
                  </div>
                  {c.target_value != null && <p className="text-sm text-primary font-medium">Target: {c.target_value} {c.target_unit}</p>}
                  {c.metric && <p className="text-xs text-muted-foreground">Metric: {c.metric}</p>}
                  {c.description && <p className="text-sm text-muted-foreground mt-1">{c.description}</p>}
                  {c.deadline && <p className="text-xs text-muted-foreground mt-1">Due {c.deadline}</p>}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">{c.challenge_completions?.length ?? 0} completed</p>
                {done ? (
                  <span className="inline-flex items-center gap-1 text-sm text-primary font-medium"><CheckCircle2 className="size-4" /> You completed this</span>
                ) : completeFor === c.id ? (
                  <div className="flex gap-2">
                    <Input placeholder={`Your value (${c.target_unit ?? ""})`} value={completeVal} onChange={e => setCompleteVal(e.target.value)} />
                    <Button size="sm" onClick={() => complete(c.id)}>Mark done</Button>
                    <Button size="sm" variant="ghost" onClick={() => setCompleteFor(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setCompleteFor(c.id)}><CheckCircle2 className="size-4" /> I did it</Button>
                )}
              </div>
            </div>
          );
        })}
        {!challenges?.length && <p className="text-muted-foreground text-center py-16 col-span-full">No challenges yet. Create the first one.</p>}
      </div>
    </div>
  );
}
