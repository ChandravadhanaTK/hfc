import { createFileRoute } from "@tanstack/react-router";
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
import { Plus, Share2, Trophy, Unlock, MessageSquare, Target } from "lucide-react";
import { ChallengesPanel } from "@/components/challenges-panel";

export const Route = createFileRoute("/app/achievements")({ component: Achievements });

function Achievements() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"standards" | "challenges">("standards");
  const [form, setForm] = useState({ title: "", description: "", standard: "" });
  const [attemptFor, setAttemptFor] = useState<string | null>(null);
  const [attemptForm, setAttemptForm] = useState({ result: "", story: "" });
  const [commentsFor, setCommentsFor] = useState<string | null>(null);

  const { data: achievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => (await supabase.from("achievements").select("*, achievement_attempts(id, user_id, result, story, attempted_at)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: myBadges } = useQuery({
    queryKey: ["my-badges", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("user_badges").select("awarded_at, badges(code, name, description, tier, icon)").eq("user_id", user!.id)).data ?? [],
  });

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("achievements").insert({ ...form, created_by: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Standard set");
    setOpen(false); setForm({ title: "", description: "", standard: "" });
    qc.invalidateQueries({ queryKey: ["achievements"] });
  };

  const unlock = async (id: string) => {
    if (!attemptForm.result) return;
    const { error } = await supabase.from("achievement_attempts").insert({
      achievement_id: id, user_id: user!.id,
      result: attemptForm.result, story: attemptForm.story || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Achievement unlocked! 🏆");
    setAttemptFor(null); setAttemptForm({ result: "", story: "" });
    qc.invalidateQueries({ queryKey: ["achievements"] });
    // Auto-award threshold badges
    try {
      const { count } = await supabase.from("achievement_attempts").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      const total = count ?? 0;
      const { data: badges } = await supabase.from("badges").select("id, code, name, threshold").not("threshold", "is", null);
      const earned = (badges ?? []).filter(b => (b.threshold ?? Infinity) <= total);
      for (const b of earned) {
        const { error: bErr } = await supabase.from("user_badges").insert({ user_id: user!.id, badge_id: b.id });
        if (!bErr) toast.success(`Badge earned: ${b.name}`);
      }
      qc.invalidateQueries({ queryKey: ["my-badges"] });
    } catch { /* badge errors are non-fatal */ }
  };

  const share = (a: any) => {
    const text = `I just completed "${a.title}" at HFC! ${a.standard ?? ""}`;
    if (navigator.share) navigator.share({ title: a.title, text });
    else { navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-bold">Achievement Board</h1>
          <p className="text-muted-foreground mt-2">Unlock standards. Take on challenges. Share your journey.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={() => setTab("standards")}><Plus className="size-4" /> Set a standard</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New achievement</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="5K under 20 min" required /></div>
                <div><Label>Standard</Label><Input value={form.standard} onChange={e => setForm({...form, standard: e.target.value})} placeholder="< 20:00" /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <Button type="submit" className="w-full">Post</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant={tab === "challenges" ? "default" : "outline"} onClick={() => setTab(tab === "challenges" ? "standards" : "challenges")}>
            <Target className="size-4" /> Challenges
          </Button>
        </div>
      </header>

      <div className="inline-flex rounded-lg border bg-muted p-1">
        <button onClick={() => setTab("standards")} className={`px-4 py-1.5 text-sm rounded-md transition ${tab === "standards" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>Standards</button>
        <button onClick={() => setTab("challenges")} className={`px-4 py-1.5 text-sm rounded-md transition ${tab === "challenges" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>Challenges</button>
      </div>

      {tab === "challenges" ? <ChallengesPanel /> : (
      <div className="space-y-6">
      {myBadges && myBadges.length > 0 && (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold mb-3">Your badges <span className="text-muted-foreground font-normal">({myBadges.length})</span></h2>
          <div className="flex flex-wrap gap-3">
            {myBadges.map((b: any, i: number) => (
              <div key={i} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${b.badges?.tier === "gold" ? "bg-gold text-gold-foreground" : b.badges?.tier === "silver" ? "bg-muted" : "bg-accent text-accent-foreground"}`}>
                <Trophy className="size-3" /> {b.badges?.name}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-4">

        {achievements?.map((a: any) => {
          const userAttempt = a.achievement_attempts?.find((at: any) => at.user_id === user!.id);
          return (
            <div key={a.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${userAttempt ? "bg-gold text-gold-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Trophy className="size-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.standard && <p className="text-sm text-primary font-medium">{a.standard}</p>}
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => share(a)}><Share2 className="size-4" /></Button>
              </div>

              {userAttempt?.story && (
                <div className="mt-3 p-3 bg-muted/40 rounded-lg text-sm italic">“{userAttempt.story}”</div>
              )}

              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs text-muted-foreground">{a.achievement_attempts?.length ?? 0} unlocks</p>
                {attemptFor === a.id ? (
                  <div className="space-y-2">
                    <Input placeholder="Your result" value={attemptForm.result} onChange={e => setAttemptForm({...attemptForm, result: e.target.value})} />
                    <Textarea rows={2} placeholder="Story about your journey…" value={attemptForm.story} onChange={e => setAttemptForm({...attemptForm, story: e.target.value})} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => unlock(a.id)}><Unlock className="size-4" /> Unlock</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAttemptFor(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {!userAttempt && <Button size="sm" variant="outline" onClick={() => setAttemptFor(a.id)}><Unlock className="size-4" /> Unlock</Button>}
                    {a.achievement_attempts?.length > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => setCommentsFor(commentsFor === a.id ? null : a.id)}>
                        <MessageSquare className="size-4" /> Comments
                      </Button>
                    )}
                  </div>
                )}
                {commentsFor === a.id && <CommentsThread attemptIds={a.achievement_attempts.map((x: any) => x.id)} />}
              </div>
            </div>
          );
        })}
        {!achievements?.length && <p className="text-muted-foreground text-center py-16 col-span-full">No achievements yet. Be the first to set a standard.</p>}
      </div>
      </div>
      )}
    </div>
  );
}

function CommentsThread({ attemptIds }: { attemptIds: string[] }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const { data: comments } = useQuery({
    queryKey: ["acom", attemptIds.join(",")],
    queryFn: async () => {
      if (!attemptIds.length) return [];
      const { data } = await supabase.from("achievement_comments").select("*").in("attempt_id", attemptIds).order("created_at");
      return data ?? [];
    },
  });
  const post = async () => {
    if (!content.trim() || !attemptIds[0]) return;
    const { error } = await supabase.from("achievement_comments").insert({
      attempt_id: attemptIds[0], user_id: user!.id, content: content.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setContent("");
    qc.invalidateQueries({ queryKey: ["acom", attemptIds.join(",")] });
  };
  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {comments?.length ? comments.map((c: any) => (
          <div key={c.id} className="text-sm p-2 bg-muted/40 rounded">{c.content}</div>
        )) : <p className="text-xs text-muted-foreground">No comments yet — be the first to cheer.</p>}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Comment…" value={content} onChange={e => setContent(e.target.value)} />
        <Button size="sm" onClick={post}>Post</Button>
      </div>
    </div>
  );
}
