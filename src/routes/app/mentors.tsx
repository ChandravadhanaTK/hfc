import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { MessageSquare, UserCheck, Users, Dumbbell, ClipboardCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { ChatPanel } from "@/components/chat-panel";

export const Route = createFileRoute("/app/mentors")({ component: MentorsPage });

type Tab = "list" | "chat" | "classes";

function MentorsPage() {
  const { user, isAdmin, isMentor } = useAuth();
  const [tab, setTab] = useState<Tab>("list");
  const [chatPeer, setChatPeer] = useState<string | null>(null);

  const { data: mentors } = useQuery({
    queryKey: ["mentors-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "mentor");
      const ids = (roles ?? []).map(r => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("public_profiles").select("id, full_name, username, avatar_url, fitness_experience, fitness_goals").in("id", ids);
      return data ?? [];
    },
  });

  const { data: trainers } = useQuery({
    queryKey: ["trainers-list"],
    queryFn: async () => (await supabase.from("trainers").select("*").order("name")).data ?? [],
  });

  const { data: myProfile, refetch } = useQuery({
    queryKey: ["my-profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("mentor_id").eq("id", user!.id).single()).data,
  });

  const pick = async (mentorId: string) => {
    const { error } = await supabase.from("profiles").update({ mentor_id: mentorId }).eq("id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mentor selected");
    refetch();
  };

  const canRunClasses = isAdmin || isMentor;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Mentors</h1>
        <p className="text-muted-foreground mt-2">Meet your guides. Pick one and start a thread. Assignments are managed on the About → Members tab.</p>
      </header>

      <div className="inline-flex rounded-lg border bg-muted p-1 flex-wrap">
        <TabBtn active={tab==="list"} onClick={() => setTab("list")}><Users className="size-4 inline mr-1" /> Find a Mentor</TabBtn>
        <TabBtn active={tab==="chat"} onClick={() => setTab("chat")}><MessageSquare className="size-4 inline mr-1" /> Mentor Chat</TabBtn>
        {canRunClasses && <TabBtn active={tab==="classes"} onClick={() => setTab("classes")}><ClipboardCheck className="size-4 inline mr-1" /> Classes</TabBtn>}
      </div>

      {tab === "list" && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Mentors</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {mentors?.map((m: any) => {
                const isMine = myProfile?.mentor_id === m.id;
                return (
                  <div key={m.id} className="rounded-xl border bg-card p-5 flex gap-4">
                    <div className="size-14 rounded-full bg-muted overflow-hidden flex items-center justify-center text-lg font-semibold">
                      {m.avatar_url ? <img src={m.avatar_url} alt="" className="size-full object-cover" /> : (m.full_name || toTitleCase(m.username) || "?").slice(0,1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{m.full_name || toTitleCase(m.username)}</h3>
                      {m.fitness_experience && <p className="text-xs text-muted-foreground">{m.fitness_experience}</p>}
                      {m.fitness_goals && <p className="text-sm mt-1 line-clamp-2">{m.fitness_goals}</p>}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {isMine ? (
                          <span className="inline-flex items-center gap-1 text-xs text-primary"><UserCheck className="size-3" /> Your mentor</span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => pick(m.id)}>Choose as mentor</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => { setChatPeer(m.id); setTab("chat"); }}>
                          <MessageSquare className="size-4" /> Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!mentors?.length && <p className="text-muted-foreground text-center py-8 col-span-full">No mentors registered yet.</p>}
            </div>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-wider text-muted-foreground mb-3">Trainers</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {trainers?.map((t: any) => (
                <div key={t.id} className="rounded-xl border bg-card p-5 flex gap-4">
                  <div className="size-14 rounded-full bg-muted overflow-hidden flex items-center justify-center text-lg font-semibold">
                    {t.avatar_url ? <img src={t.avatar_url} alt="" className="size-full object-cover" /> : (t.name || "?").slice(0,1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{t.name}</h3>
                    {t.hfc_code_name && <p className="text-[10px] uppercase tracking-wider text-gold">Code: {t.hfc_code_name}</p>}
                    {t.specialty && <p className="text-xs text-muted-foreground"><Dumbbell className="size-3 inline" /> {t.specialty}</p>}
                    {t.bio && <p className="text-sm mt-1 line-clamp-2">{t.bio}</p>}
                  </div>
                </div>
              ))}
              {!trainers?.length && <p className="text-muted-foreground text-center py-8 col-span-full">No trainers added yet.</p>}
            </div>
          </section>
        </div>
      )}

      {tab === "chat" && <ChatPanel initialDm={chatPeer} />}
      {tab === "classes" && canRunClasses && <ClassesTab uid={user!.id} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return <button onClick={onClick} className={`px-4 py-1.5 text-sm rounded-md transition ${active ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>{children}</button>;
}

/* ============================== CLASSES TAB ============================== */

function ClassesTab({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const [groupId, setGroupId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: groups } = useQuery({
    queryKey: ["cls-groups"],
    queryFn: async () => (await supabase.from("gallery_groups").select("id,name").order("name")).data ?? [],
  });

  const { data: members } = useQuery({
    queryKey: ["cls-members", groupId],
    enabled: !!groupId,
    queryFn: async () => (await supabase.from("public_profiles").select("id, username, nickname, full_name").eq("group_id", groupId).order("username")).data ?? [],
  });

  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ["cls-sessions", uid],
    queryFn: async () => {
      const { data } = await supabase.from("class_sessions").select("id, group_id, class_date, notes, recorded_by").order("class_date", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  const { data: attendees } = useQuery({
    queryKey: ["cls-attendees", sessions?.map(s=>s.id).join(",")],
    enabled: !!sessions?.length,
    queryFn: async () => (await supabase.from("class_attendees").select("session_id, user_id").in("session_id", sessions!.map(s=>s.id))).data ?? [],
  });

  const groupName = (gid: string) => groups?.find(g => g.id === gid)?.name ?? "—";
  const attendeeCount = useMemo(() => {
    const m = new Map<string, number>();
    (attendees ?? []).forEach(a => m.set(a.session_id, (m.get(a.session_id) ?? 0) + 1));
    return m;
  }, [attendees]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const save = async () => {
    if (!groupId) { toast.error("Pick a group"); return; }
    if (selected.size === 0) { toast.error("Select at least one attendee"); return; }
    const { data: session, error } = await supabase.from("class_sessions").insert({ group_id: groupId, class_date: date, recorded_by: uid, notes: notes || null }).select().single();
    if (error || !session) { toast.error(error?.message ?? "Failed"); return; }
    const rows = [...selected].map(user_id => ({ session_id: session.id, user_id }));
    const { error: aerr } = await supabase.from("class_attendees").insert(rows);
    if (aerr) { toast.error(aerr.message); return; }
    toast.success(`Class logged: ${selected.size} attendees`);
    setSelected(new Set()); setNotes("");
    refetchSessions(); qc.invalidateQueries({ queryKey: ["cls-attendees"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this class session?")) return;
    const { error } = await supabase.from("class_sessions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    refetchSessions();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Record a class</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Group</label>
            <select value={groupId} onChange={e => { setGroupId(e.target.value); setSelected(new Set()); }} className="w-full border rounded px-2 py-1.5 text-sm">
              <option value="">— Select —</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="optional" className="w-full border rounded px-2 py-1.5 text-sm" />
          </div>
        </div>

        {groupId && (
          <div>
            <p className="text-sm font-semibold mb-2">Attendees ({selected.size} / {members?.length ?? 0})</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 border rounded">
              {members?.filter(m => !!m.id).map(m => (
                <label key={m.id!} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1">
                  <input type="checkbox" checked={selected.has(m.id!)} onChange={() => toggle(m.id!)} />
                  <span>{m.nickname ? `${m.nickname} ` : ""}{toTitleCase(m.username || m.full_name)}</span>
                </label>
              ))}
              {!members?.length && <p className="col-span-full text-xs text-muted-foreground p-2">No members in this group yet.</p>}
            </div>
          </div>
        )}

        <Button onClick={save} disabled={!groupId || !selected.size}>Save class</Button>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Recent classes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b">
              <th className="py-2 pr-3">Date</th><th>Group</th><th>Attendees</th><th>Notes</th><th></th>
            </tr></thead>
            <tbody>
              {sessions?.map(s => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-3">{s.class_date}</td>
                  <td>{groupName(s.group_id)}</td>
                  <td>{attendeeCount.get(s.id) ?? 0}</td>
                  <td className="text-muted-foreground">{s.notes}</td>
                  <td>{s.recorded_by === uid && <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="size-4" /></Button>}</td>
                </tr>
              ))}
              {!sessions?.length && <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No sessions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
