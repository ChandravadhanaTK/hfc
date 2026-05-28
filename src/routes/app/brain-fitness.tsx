import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Trophy, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/brain-fitness")({ component: BrainFitness });

function BrainFitness() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    one_liner: "",
    start_date: "",
    end_date: "",
    public_url: "",
    status: "reading",
  });

  const { data: books } = useQuery({
    queryKey: ["brain-fitness", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("book_log")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("Book name is required");
      const payload: any = {
        user_id: user!.id,
        title: form.title.trim(),
        one_liner: form.one_liner.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        public_url: form.public_url.trim() || null,
        status: form.status,
        finished_at: form.status === "finished" ? form.end_date || new Date().toISOString().slice(0, 10) : null,
      };
      const { error } = await supabase.from("book_log").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Book added");
      setForm({ title: "", one_liner: "", start_date: "", end_date: "", public_url: "", status: "reading" });
      qc.invalidateQueries({ queryKey: ["brain-fitness"] });
      qc.invalidateQueries({ queryKey: ["lb-books"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("book_log").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brain-fitness"] });
      qc.invalidateQueries({ queryKey: ["lb-books"] });
    },
  });

  const finished = books?.filter((b) => b.status === "finished").length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2"><BookOpen className="size-8" /> Brain Fitness</h1>
          <p className="text-muted-foreground mt-2">Read. Reflect. Rank up.</p>
        </div>
        <Link
          to="/app/leaderboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Trophy className="size-4" /> View Brain Fitness leaderboard
        </Link>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Books finished</p>
          <p className="text-3xl font-bold mt-1">{finished}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Currently reading</p>
          <p className="text-3xl font-bold mt-1">{books?.filter((b) => b.status === "reading").length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total logged</p>
          <p className="text-3xl font-bold mt-1">{books?.length ?? 0}</p>
        </div>
      </div>

      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add a book</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="title">Book name *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Atomic Habits" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="one_liner">1-liner about the book</Label>
            <Textarea id="one_liner" rows={2} value={form.one_liner} onChange={(e) => setForm({ ...form, one_liner: e.target.value })} placeholder="Tiny changes, remarkable results." />
          </div>
          <div>
            <Label htmlFor="start_date">Started on</Label>
            <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="end_date">Finished on</Label>
            <Input id="end_date" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="public_url">Public link URL</Label>
            <Input id="public_url" type="url" value={form.public_url} onChange={(e) => setForm({ ...form, public_url: e.target.value })} placeholder="https://goodreads.com/..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => add.mutate()} disabled={add.isPending}>
          {add.isPending ? "Saving…" : "Save book"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your reading log</h2>
        {!books?.length && <p className="text-muted-foreground text-sm">No books yet — add your first one above.</p>}
        <div className="space-y-2">
          {books?.map((b) => (
            <div key={b.id} className="rounded-xl border bg-card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{b.title}</p>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full ${b.status === "finished" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{b.status}</span>
                </div>
                {b.one_liner && <p className="text-sm text-muted-foreground mt-1">{b.one_liner}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {b.start_date && <>Started {b.start_date}</>}
                  {b.start_date && b.end_date && " · "}
                  {b.end_date && <>Finished {b.end_date}</>}
                </p>
                {b.public_url && (
                  <a href={b.public_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                    <ExternalLink className="size-3" /> Public link
                  </a>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
