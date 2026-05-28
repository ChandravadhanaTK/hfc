import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, ChevronDown, ChevronUp, Users } from "lucide-react";
import { dispatchSms } from "@/lib/sms.functions";

export const Route = createFileRoute("/app/community")({ component: Community });

function Community() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const sendSms = useServerFn(dispatchSms);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [eventOpen, setEventOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rsvpListFor, setRsvpListFor] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({ title: "", description: "", event_date: "", event_time: "", event_type: "", location: "" });
  const [actForm, setActForm] = useState({ title: "", description: "", activity_date: "", activity_time: "", location: "" });

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => (await supabase.from("events").select("*").order("event_date", { ascending: false })).data ?? [],
  });

  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => (await supabase.from("activities").select("*").order("activity_date", { ascending: false })).data ?? [],
  });

  const { data: myRsvps } = useQuery({
    queryKey: ["my-rsvps", user?.id],
    queryFn: async () => (await supabase.from("event_rsvps").select("event_id").eq("user_id", user!.id)).data ?? [],
    enabled: !!user,
  });
  const rsvpedSet = new Set((myRsvps ?? []).map((r: any) => r.event_id));

  const createEvent = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("events").insert({ ...eventForm, created_by: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Event created — members notified");
    sendSms({ data: { kind: "event", title: `New event: ${eventForm.title}`, body: eventForm.description, excludeUserId: user!.id } }).catch(() => {});
    setEventOpen(false);
    setEventForm({ title: "", description: "", event_date: "", event_time: "", event_type: "", location: "" });
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  const createActivity = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("activities").insert({ ...actForm, created_by: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Activity posted — members notified");
    sendSms({ data: { kind: "activity", title: `New activity: ${actForm.title}`, body: actForm.description, excludeUserId: user!.id } }).catch(() => {});
    setActOpen(false);
    setActForm({ title: "", description: "", activity_date: "", activity_time: "", location: "" });
    qc.invalidateQueries({ queryKey: ["activities"] });
  };

  const rsvp = async (event_id: string) => {
    const { error } = await supabase.from("event_rsvps").insert({ event_id, user_id: user!.id });
    if (error) { toast.error(error.message); return; }
    toast.success("RSVP'd!");
    const evt = (events ?? []).find((e: any) => e.id === event_id);
    if (evt) sendSms({ data: { kind: "rsvp", title: `New RSVP for ${evt.title}`, excludeUserId: user!.id } }).catch(() => {});
    qc.invalidateQueries({ queryKey: ["my-rsvps", user?.id] });
  };

  const eventDates = (events ?? []).map(e => new Date(e.event_date));
  const ds = date?.toISOString().slice(0,10);
  const dayEvents = (events ?? []).filter(e => e.event_date === ds);
  const dayActs = (activities ?? []).filter(a => a.activity_date === ds);
  const upcoming = [
    ...(events ?? []).map(e => ({ ...e, _kind: "event" as const, _date: e.event_date })),
    ...(activities ?? []).map(a => ({ ...a, _kind: "activity" as const, _date: a.activity_date, event_type: "Activity" })),
  ].filter(x => new Date(x._date) >= new Date(new Date().toDateString())).sort((a,b) => a._date.localeCompare(b._date)).slice(0, 8);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-bold">Community</h1>
          <p className="text-muted-foreground mt-2">Events, gatherings, member activities.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <Dialog open={eventOpen} onOpenChange={setEventOpen}>
              <DialogTrigger asChild><Button><Plus className="size-4" /> Create event</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New event (admin)</DialogTitle></DialogHeader>
                <form onSubmit={createEvent} className="space-y-3">
                  <div><Label>Title</Label><Input value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required /></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Date</Label><Input type="date" value={eventForm.event_date} onChange={e => setEventForm({...eventForm, event_date: e.target.value})} required /></div>
                    <div><Label>Time</Label><Input type="time" value={eventForm.event_time} onChange={e => setEventForm({...eventForm, event_time: e.target.value})} /></div>
                    <div><Label>Type</Label><Input placeholder="HFD…" value={eventForm.event_type} onChange={e => setEventForm({...eventForm, event_type: e.target.value})} /></div>
                  </div>
                  <div><Label>Location</Label><Input value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} /></div>
                  <div><Label>Description</Label><Textarea rows={3} value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} /></div>
                  <Button type="submit" className="w-full">Create & notify</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={actOpen} onOpenChange={setActOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="size-4" /> Create activity</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New activity</DialogTitle></DialogHeader>
              <form onSubmit={createActivity} className="space-y-3">
                <div><Label>Title</Label><Input value={actForm.title} onChange={e => setActForm({...actForm, title: e.target.value})} required /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Date</Label><Input type="date" value={actForm.activity_date} onChange={e => setActForm({...actForm, activity_date: e.target.value})} required /></div>
                  <div><Label>Time</Label><Input type="time" value={actForm.activity_time} onChange={e => setActForm({...actForm, activity_time: e.target.value})} /></div>
                  <div><Label>Location</Label><Input value={actForm.location} onChange={e => setActForm({...actForm, location: e.target.value})} /></div>
                </div>
                <div><Label>Description</Label><Textarea rows={3} value={actForm.description} onChange={e => setActForm({...actForm, description: e.target.value})} /></div>
                <Button type="submit" className="w-full">Post activity</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid md:grid-cols-[auto_1fr] gap-6">
        <div className="rounded-xl border bg-card p-4">
          <Calendar mode="single" selected={date} onSelect={setDate} modifiers={{ event: eventDates }} modifiersClassNames={{ event: "bg-gold/30 font-bold text-gold-foreground rounded" }} className="pointer-events-auto" />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-display font-semibold mb-3">{date?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h3>
            {(dayEvents.length || dayActs.length) ? (
              <>
                {dayEvents.map(e => (
                  <CardRow
                    key={e.id}
                    id={e.id}
                    kind="Event"
                    title={e.title}
                    meta={`${e.event_type ?? ""} ${e.location ? "• " + e.location : ""}`}
                    description={e.description}
                    expanded={expanded === e.id}
                    onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
                    actions={
                      <>
                        <Button size="sm" variant={rsvpedSet.has(e.id) ? "secondary" : "outline"} disabled={rsvpedSet.has(e.id)} onClick={() => rsvp(e.id)}>
                          {rsvpedSet.has(e.id) ? "RSVP'd" : "RSVP"}
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" onClick={() => setRsvpListFor(e.id)}><Users className="size-4" /></Button>
                        )}
                      </>
                    }
                  />
                ))}
                {dayActs.map(a => (
                  <CardRow
                    key={a.id}
                    id={a.id}
                    kind="Activity"
                    title={a.title}
                    meta={a.location ?? ""}
                    description={a.description}
                    expanded={expanded === a.id}
                    onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
                  />
                ))}
              </>
            ) : <p className="text-sm text-muted-foreground">Nothing on this day.</p>}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-display font-semibold mb-3">Live updates</h3>
            <ul className="space-y-2 text-sm">
              {upcoming.map(x => (
                <li key={x.id} className="flex justify-between gap-3 border-b last:border-0 pb-2">
                  <span>
                    <Badge variant="outline" className="mr-2 text-[10px]">{x._kind}</Badge>
                    <span className="font-medium">{x.title}</span>
                    {x.event_type && <span className="text-muted-foreground"> — {x.event_type}</span>}
                  </span>
                  <span className="text-primary text-xs whitespace-nowrap">{new Date(x._date).toLocaleDateString()}</span>
                </li>
              ))}
              {!upcoming.length && <li className="text-muted-foreground">No upcoming items.</li>}
            </ul>
          </div>
        </div>
      </div>

      {isAdmin && rsvpListFor && <RsvpListDialog eventId={rsvpListFor} onClose={() => setRsvpListFor(null)} />}
    </div>
  );
}

function CardRow({ id, kind, title, meta, description, expanded, onToggle, actions }: any) {
  return (
    <div className="border-b last:border-0 py-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">{kind}</Badge>
            <p className="font-semibold truncate">{title}</p>
          </div>
          {meta && <p className="text-xs text-muted-foreground mt-1">{meta}</p>}
          {expanded && description && <p className="text-sm mt-2">{description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {actions}
          <Button size="sm" variant="ghost" onClick={onToggle}>
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            <span className="ml-1 text-xs">{expanded ? "Less" : "More details"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function RsvpListDialog({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["rsvp-list", eventId],
    queryFn: async () => {
      const { data: rsvps } = await supabase.from("event_rsvps").select("user_id, created_at").eq("event_id", eventId);
      const ids = (rsvps ?? []).map(r => r.user_id);
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("public_profiles").select("id, full_name, username").in("id", ids);
      return (profs ?? []).map(p => ({ ...p, rsvp_at: rsvps?.find(r => r.user_id === p.id)?.created_at }));
    },
  });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>RSVP list</DialogTitle></DialogHeader>
        <div className="divide-y max-h-96 overflow-y-auto">
          {data?.length ? data.map((u: any) => (
            <div key={u.id} className="py-2 text-sm flex justify-between">
              <div>
                <p className="font-medium">{u.full_name || toTitleCase(u.username)}</p>
              </div>

              <p className="text-xs text-muted-foreground">{u.rsvp_at && new Date(u.rsvp_at).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground py-6 text-center">No RSVPs yet.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
