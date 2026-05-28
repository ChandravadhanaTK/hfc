import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Holistic Fitness Club" },
      { name: "description", content: "Sign in to your HFC account to continue your training, log progress and connect with your community." },
      { property: "og:title", content: "Sign in — Holistic Fitness Club" },
      { property: "og:description", content: "Sign in to your HFC account to continue your training." },
      { property: "og:url", content: "https://hfc-zenith-flow.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://hfc-zenith-flow.lovable.app/login" }],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    // Returning-user check: read last_login_at BEFORE updating it.
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("last_login_at, full_name, username, nickname")
        .eq("id", data.user.id)
        .maybeSingle();
      const toTitleCase = (s: string) =>
        s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      const rawUsername = profile?.username || profile?.full_name || data.user.email?.split("@")[0] || "";
      const usernameTC = toTitleCase(rawUsername);
      const displayName = profile?.nickname
        ? `${profile.nickname} ${usernameTC}`.trim()
        : usernameTC;
      if (profile?.last_login_at) {
        toast.success(`Welcome back${displayName ? ` - ${displayName}` : ""}!`);
      } else {
        toast.success(`Welcome - first login${displayName ? ` ${displayName}` : ""}!`);
      }
      await supabase.from("profiles").update({ last_login_at: new Date().toISOString() }).eq("id", data.user.id);
    }
    nav({ to: "/app" });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <main className="m-auto w-full max-w-md bg-card rounded-2xl p-8 shadow-[var(--shadow-elegant)]">
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">← HFC</Link>
        <h1 className="text-3xl font-bold mt-4 mb-2">Sign in</h1>
        <p className="text-sm text-muted-foreground mb-6">Continue your journey.</p>
        <form onSubmit={handle} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="text-sm text-center text-muted-foreground mt-6">
          New to HFC? <Link to="/signup" className="text-primary font-medium">Create account</Link>
        </p>
      </main>
    </div>
  );
}
