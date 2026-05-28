import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ROOMS = [
  { id: "mentors", label: "Ask Mentors (group)" },
  { id: "debates", label: "Friendly Debates" },
  { id: "brigade", label: "Brigade Unit" },
];

export function ChatPanel({ initialDm }: { initialDm?: string | null }) {
  const { user, roles } = useAuth();
  const isMentor = roles.includes("mentor") || roles.includes("admin");
  const [mode, setMode] = useState<"room" | "dm">(initialDm ? "dm" : "room");
  const [room, setRoom] = useState("mentors");
  const [peerId, setPeerId] = useState<string | null>(initialDm ?? null);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDm) { setMode("dm"); setPeerId(initialDm); }
  }, [initialDm]);

  const { data: me } = useQuery({
    queryKey: ["me-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("mentor_id, full_name, username").eq("id", user!.id).single()).data,
  });

  const { data: partners } = useQuery({
    queryKey: ["dm-partners", user?.id, isMentor],
    enabled: !!user,
    queryFn: async () => {
      if (isMentor) {
        const { data } = await supabase.from("public_profiles").select("id, full_name, username, avatar_url").eq("mentor_id", user!.id);
        return data ?? [];
      }
      const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "mentor");
      const ids = (roleRows ?? []).map(r => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("public_profiles").select("id, full_name, username, avatar_url").in("id", ids);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (mode === "dm" && !peerId && me?.mentor_id) setPeerId(me.mentor_id);
  }, [mode, peerId, me]);

  const queryKey = mode === "room" ? ["chat-room", room] : ["chat-dm", user?.id, peerId];
  const { data: msgs, refetch } = useQuery({
    queryKey,
    enabled: !!user && (mode === "room" || !!peerId),
    queryFn: async () => {
      if (mode === "room") {
        const { data } = await supabase
          .from("chat_messages")
          .select("*, profiles!chat_messages_sender_id_fkey(username, full_name)")
          .eq("room", room).is("recipient_id", null)
          .order("created_at").limit(200);
        return data ?? [];
      }
      const { data } = await supabase
        .from("chat_messages")
        .select("*, profiles!chat_messages_sender_id_fkey(username, full_name)")
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user!.id})`)
        .order("created_at").limit(200);
      return data ?? [];
    },
  });

  const channelKey = useMemo(() => mode === "room" ? `room:${room}` : `dm:${[user?.id, peerId].sort().join(":")}`, [mode, room, peerId, user]);
  useEffect(() => {
    if (!user) return;
    if (mode === "dm" && !peerId) return;
    const ch = supabase.channel(`chat-${channelKey}-${Date.now()}`);
    if (mode === "room") {
      ch.on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "chat_messages", filter: `room=eq.${room}` }, () => refetch());
    } else {
      ch.on("postgres_changes" as any, { event: "INSERT", schema: "public", table: "chat_messages" }, (payload: any) => {
        const r = payload.new;
        if ((r.sender_id === user.id && r.recipient_id === peerId) || (r.sender_id === peerId && r.recipient_id === user.id)) refetch();
      });
    }
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channelKey, mode, room, peerId, user, refetch]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!text.trim()) return;
    const payload: any = { sender_id: user!.id, content: text };
    if (mode === "room") { payload.room = room; }
    else {
      if (!peerId) { toast.error("Pick someone to message"); return; }
      payload.room = "dm"; payload.recipient_id = peerId;
    }
    const { error } = await supabase.from("chat_messages").insert(payload);
    if (error) { toast.error(error.message); return; }
    setText("");
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setMode("room")} className={`px-4 py-2 rounded-full text-sm font-medium ${mode === "room" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Group rooms</button>
        <button onClick={() => setMode("dm")} className={`px-4 py-2 rounded-full text-sm font-medium ${mode === "dm" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{isMentor ? "Mentees DM" : "Mentor DM"}</button>
      </div>

      {mode === "room" ? (
        <div className="flex gap-2 flex-wrap">
          {ROOMS.map(r => (
            <button key={r.id} onClick={() => setRoom(r.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${room === r.id ? "bg-accent text-accent-foreground" : "bg-muted/60"}`}>{r.label}</button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground">{isMentor ? "Mentee:" : "Mentor:"}</span>
          {partners?.length ? partners.map((p: any) => (
            <button key={p.id} onClick={() => setPeerId(p.id)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${peerId === p.id ? "bg-accent text-accent-foreground" : "bg-muted/60"}`}>
              {p.full_name || toTitleCase(p.username)}
            </button>
          )) : <span className="text-xs text-muted-foreground">No one to message yet.</span>}
        </div>
      )}

      <div className="rounded-xl border bg-card flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs?.map((m: any) => {
            const mine = m.sender_id === user!.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {!mine && <p className="text-xs opacity-70 mb-0.5">{m.profiles?.full_name || toTitleCase(m.profiles?.username) || "Member"}</p>}
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })}
          {!msgs?.length && <p className="text-center text-muted-foreground py-10">No messages yet. Say hi.</p>}
          <div ref={endRef} />
        </div>
        <div className="border-t p-3 flex gap-2">
          <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} placeholder="Type a message…" />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
    </div>
  );
}
