import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Join the Club — Holistic Fitness Club" },
      { name: "description", content: "Create your HFC account. Choose your training type, set your profile and join a holistic fitness community." },
      { property: "og:title", content: "Join the Club — Holistic Fitness Club" },
      { property: "og:description", content: "Create your HFC account and start your holistic fitness journey today." },
      { property: "og:url", content: "https://hfc-zenith-flow.lovable.app/signup" },
    ],
    links: [{ rel: "canonical", href: "https://hfc-zenith-flow.lovable.app/signup" }],
  }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    email: "", password: "", username: "", full_name: "",
    training_type: "OT", gender: "male", phone: "",
    birthday: "", social_handle: "",
    trainer_id: "", group_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("trainers").select("id, name").order("sort_order").order("name")
      .then(({ data }) => setTrainers(data ?? []));
    supabase.from("gallery_groups").select("id, name").order("sort_order")
      .then(({ data }) => setGroups(data ?? []));
  }, []);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          username: form.username,
          full_name: form.full_name,
          trainer_id: form.trainer_id || "",
          group_id: form.group_id || "",
        },
      },
    });
    if (error) { setLoading(false); toast.error(error.message); return; }
    if (data.user) {
      await supabase.from("profiles").update({
        training_type: form.training_type as "OT"|"PT"|"KT"|"GT",
        team: (form.training_type === "KT" ? "OT" : form.training_type) as "OT"|"PT"|"PF"|"GT",
        gender: form.gender as "male"|"female",
        phone: form.phone || null,
        birthday: form.birthday || null,
        social_handle: form.social_handle || null,
        full_name: form.full_name,
        trainer_id: form.trainer_id || null,
        group_id: form.group_id || null,
      }).eq("id", data.user.id);
    }
    setLoading(false);
    toast.success("Welcome to HFC!");
    nav({ to: "/app" });
  };

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const setFullName = (v: string) => {
    setForm((prev) => {
      const slug = v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "").slice(0, 24);
      const prevAuto = prev.full_name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 24);
      return {
        ...prev,
        full_name: v,
        username: !prev.username || prev.username === prevAuto ? slug : prev.username,
      };
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <main className="m-auto w-full max-w-lg bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)] my-8">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">← HFC</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Join the club</h1>
        <p className="text-sm text-muted-foreground mb-6">Start your holistic fitness journey.</p>
        <form onSubmit={handle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setFullName(e.target.value)} required /></div>
            <div>
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => set("username", e.target.value)} required />
              <p className="text-[10px] text-muted-foreground mt-1">Auto-filled from your name — feel free to change it.</p>
            </div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={6} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Training type</Label>
              <Select value={form.training_type} onValueChange={(v) => set("training_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OT">Online Training (OT)</SelectItem>
                  <SelectItem value="PT">Personal Training (PT)</SelectItem>
                  <SelectItem value="KT">Kids Training (KT)</SelectItem>
                  <SelectItem value="GT">Group Training (GT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trainer / Mentor</Label>
              <Select value={form.trainer_id || "none"} onValueChange={(v) => set("trainer_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select a trainer" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No preference —</SelectItem>
                  {trainers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Group</Label>
              <Select value={form.group_id || "none"} onValueChange={(v) => set("group_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select a group" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No group —</SelectItem>
                  {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Phone</Label><Input type="tel" placeholder="+1 555 555 5555" value={form.phone} onChange={(e) => set("phone", e.target.value)} required /></div>
            <div><Label>Birthday</Label><Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} /></div>
          </div>
          <div><Label>Social handle</Label><Input placeholder="@yourname" value={form.social_handle} onChange={(e) => set("social_handle", e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Already a member? <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </p>
      </main>
    </div>
  );
}
