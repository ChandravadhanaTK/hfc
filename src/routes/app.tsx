import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Home, Flame, Activity, Trophy, Calendar, Image as Gallery, Award, MessageSquare, Heart, CreditCard, LogOut, ShieldCheck, User, BookOpen, Baby, Users, Target, Dumbbell, Info, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { startSession, endSession, trackScreen } from "@/lib/analytics";
import { FeedbackButton } from "@/components/feedback-button";
import { NotificationsBell } from "@/components/notifications-bell";
import { toTitleCase } from "@/lib/format";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

const nav = [
  { to: "/app", label: "Dashboard", icon: Home, exact: true },
  { to: "/app/codex", label: "Codex", icon: Flame, tooltip: "Codex is HFC code for discipline, consistency, and becoming stronger together." },
  { to: "/app/progress", label: "Progress", icon: Activity },
  { to: "/app/brain-fitness", label: "Brain Fitness", icon: BookOpen },
  { to: "/app/kids", label: "Kids", icon: Baby },
  { to: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/app/community", label: "Community", icon: Calendar },
  { to: "/app/gallery", label: "Gallery", icon: Gallery },
  { to: "/app/achievements", label: "Achievements", icon: Award },
  { to: "/app/mentors", label: "Mentors", icon: Users },
  { to: "/app/health", label: "Health Tools", icon: Heart },
  { to: "/app/payments", label: "Payments", icon: CreditCard },
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/about", label: "About", icon: Info },
];

function AppLayout() {
  const { user, loading, roles, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("username, nickname").eq("id", user.id).single()
        .then(({ data }) => {
          const base = toTitleCase(data?.username || user.email?.split("@")[0] || "");
          setUserName(data?.nickname ? `${data.nickname} ${base}`.trim() : base);
        });
    } else {
      setUserName("");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) void startSession(user.id);
  }, [user]);

  useEffect(() => {
    if (user) void trackScreen(user.id, loc.pathname);
  }, [user, loc.pathname]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground p-4 sticky top-0 h-screen">
        <Link to="/app" className="font-display font-bold text-2xl text-sidebar-primary mb-8 px-2">HFC</Link>
        <TooltipProvider delayDuration={300}>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {nav.map((n) => {
              const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              const link = (
                <Link key={n.to} to={n.to} className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent"
                )}>
                  <n.icon className="size-4" />{n.label}
                </Link>
              );
              if (n.tooltip) {
                return (
                  <Tooltip key={n.to}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs text-xs">
                      {n.tooltip}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/app/admin" className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mt-4 border-t border-sidebar-border pt-4",
                    loc.pathname.startsWith("/app/admin") ? "bg-gold text-gold-foreground font-medium" : "hover:bg-sidebar-accent text-gold"
                  )}><ShieldCheck className="size-4" />Admin</Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Admin Panel</TooltipContent>
              </Tooltip>
            )}
          </nav>
        </TooltipProvider>
        <Button variant="ghost" onClick={async () => { await endSession(); await signOut(); navigate({ to: "/" }); }} className="justify-start text-sidebar-foreground hover:bg-sidebar-accent">
          <LogOut className="size-4" /> Sign out
        </Button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="hidden md:flex items-center justify-end px-6 py-3 border-b bg-card gap-3">
          <NotificationsBell />
          <div className="text-right">
            <div className="text-sm font-medium">{userName}</div>
            <div className="text-xs text-muted-foreground">
              {roles.map((r) => (
                <Badge key={r} variant="secondary" className="ml-1 capitalize text-[10px] px-1.5 py-0">{r}</Badge>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={async () => { await endSession(); await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="size-4" />
          </Button>
        </header>
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <Link to="/app" className="font-display font-bold text-xl">HFC</Link>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <Button variant="ghost" size="sm" onClick={async () => { await endSession(); await signOut(); navigate({ to: "/" }); }}><LogOut className="size-4" /></Button>
          </div>
        </header>
        <main className="p-6 md:p-10 max-w-6xl mx-auto">
          <Outlet />
        </main>
        <nav className="md:hidden grid grid-cols-5 gap-1 sticky bottom-0 bg-card border-t p-1">
          {nav.slice(0, 5).map((n) => (
            <Link key={n.to} to={n.to} className="flex flex-col items-center py-2 text-[10px] text-muted-foreground"><n.icon className="size-4" />{n.label}</Link>
          ))}
        </nav>
      </div>
      <FeedbackButton />
    </div>
  );
}
