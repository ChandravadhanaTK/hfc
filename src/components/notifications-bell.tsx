import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (mounted) setItems((data as Notif[]) ?? []);
    };
    void load();
    const ch = supabase
      .channel(`notifs-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)),
      )
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter(i => !i.read_at).length;

  const markRead = async () => {
    if (!user || !unread) return;
    const ids = items.filter(i => !i.read_at).map(i => i.id);
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
    setItems(prev => prev.map(i => i.read_at ? i : { ...i, read_at: new Date().toISOString() }));
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) void markRead(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0 h-5 min-w-5 text-[10px]">{unread}</Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b font-medium text-sm">Notifications</div>
        <div className="max-h-96 overflow-y-auto divide-y">
          {items.length ? items.map(n => (
            <Link
              key={n.id}
              to={n.link || "/app"}
              onClick={() => setOpen(false)}
              className={`block p-3 hover:bg-muted/50 transition-colors ${n.read_at ? "" : "bg-primary/5"}`}
            >
              <p className="font-medium text-sm">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </Link>
          )) : <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
