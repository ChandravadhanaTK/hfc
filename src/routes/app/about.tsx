import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { Heart, Target, Users, Dumbbell, Pencil, Trash2, Plus, Info, FolderKanban, UserCircle2, Check, X, ArrowUpDown, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export const Route = createFileRoute("/app/about")({ component: AboutPage });

type Tab = "about" | "trainers" | "groups" | "members";
type Trainer = {
  id: string; name: string; role: string | null; bio: string | null;
  avatar_url: string | null; specialty: string | null; sort_order: number;
  phone: string | null; phone_alt: string | null; hfc_code_name: string | null;
  nickname: string | null;
};
type Group = { id: string; name: string; description: string | null; sort_order: number };

function AboutPage() {
  const { isAdmin, isMentor } = useAuth();
  const [tab, setTab] = useState<Tab>("about");

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "about", label: "About", icon: Info },
    { key: "groups", label: "Groups", icon: FolderKanban },
    { key: "trainers", label: "Trainers", icon: Dumbbell },
    { key: "members", label: "Members", icon: UserCircle2 },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">About HFC</h1>
        <p className="text-muted-foreground mt-2">Holistic Fitness Community — body, mind, and spirit, together.</p>
      </header>

      <div className="inline-flex rounded-lg border bg-muted p-1 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-1.5 text-sm rounded-md transition ${tab === t.key ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}>
            <t.icon className="size-4 inline mr-1" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "about" && <AboutContent />}
      {tab === "groups" && <GroupsContent isAdmin={isAdmin} isMentor={isMentor} />}
      {tab === "trainers" && <TrainersContent isAdmin={isAdmin} />}
      {tab === "members" && <MembersContent isAdmin={isAdmin} isMentor={isMentor} />}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><Target className="size-6" /></div>
          <div>
            <h2 className="text-2xl font-semibold">Vision</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              A world where every family, every brigade, every individual lives with daily discipline, holistic health,
              and the joy of growing stronger together. Fitness as a way of life — not a phase.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-accent text-accent-foreground flex items-center justify-center"><Heart className="size-6" /></div>
          <div>
            <h2 className="text-2xl font-semibold">Mission</h2>
            <ul className="mt-2 space-y-2 text-muted-foreground leading-relaxed list-disc pl-5">
              <li>Coach members to live by the HFC Codex — sleep, hydration, nutrition, exercise, meditation, punctuality, reading, reduced screen time.</li>
              <li>Build a brigade-style community of mentors and mentees who hold each other accountable.</li>
              <li>Make holistic fitness measurable: every test, every standard, every challenge tracked and celebrated.</li>
              <li>Bring families along — kids, parents, elders — through the Holistic Family Day and Kids program.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-lg bg-gold text-gold-foreground flex items-center justify-center"><Users className="size-6" /></div>
          <div>
            <h2 className="text-2xl font-semibold">My Fitness Mentor Group</h2>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              HFC organises members into brigades of 8–12, each paired with a Fitness Mentor. Your mentor reviews your
              Codex daily, your Progress weekly, and your Achievements monthly — and they're one tap away on Mentor Chat.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function emptyTrainer(): Omit<Trainer, "id"> {
  return { name: "", role: "", bio: "", avatar_url: "", specialty: "", sort_order: 0, phone: "", phone_alt: "", hfc_code_name: "", nickname: "" };
}

type TrainerSort = "name" | "nickname" | "hfc_code_name" | "specialty";

function TrainersContent({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState<Omit<Trainer, "id">>(emptyTrainer());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<TrainerSort>("name");
  const [groupsDialogTrainer, setGroupsDialogTrainer] = useState<Trainer | null>(null);

  const { data: trainers } = useQuery({
    queryKey: ["trainers"],
    queryFn: async () => {
      const { data } = await supabase.from("trainers").select("*").order("name");
      return (data ?? []) as Trainer[];
    },
  });

  const { data: trainerGroups } = useQuery({
    queryKey: ["trainer-groups-map"],
    queryFn: async () => {
      const { data: profs } = await supabase.rpc("list_all_profiles");
      const { data: groups } = await supabase.from("gallery_groups").select("id, name");
      const groupName = new Map((groups ?? []).map(g => [g.id as string, g.name as string]));
      const map = new Map<string, Set<string>>();
      for (const p of (profs as any[] ?? [])) {
        if (!p.trainer_id || !p.group_id) continue;
        const name = groupName.get(p.group_id);
        if (!name) continue;
        if (!map.has(p.trainer_id)) map.set(p.trainer_id, new Set());
        map.get(p.trainer_id)!.add(name);
      }
      const out: Record<string, string[]> = {};
      map.forEach((set, k) => { out[k] = Array.from(set).sort(); });
      return out;
    },
  });

  const openNew = () => { setEditing(null); setForm(emptyTrainer()); setOpen(true); };
  const openEdit = (t: Trainer) => {
    setEditing(t);
    setForm({
      name: t.name, role: t.role ?? "", bio: t.bio ?? "",
      avatar_url: t.avatar_url ?? "", specialty: t.specialty ?? "", sort_order: t.sort_order,
      phone: t.phone ?? "", phone_alt: t.phone_alt ?? "", hfc_code_name: t.hfc_code_name ?? "",
      nickname: t.nickname ?? "",
    });
    setOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      role: null, bio: form.bio || null,
      avatar_url: form.avatar_url || null, specialty: form.specialty || null,
      phone: form.phone || null, phone_alt: form.phone_alt || null,
      hfc_code_name: form.hfc_code_name || null,
      nickname: form.nickname || null,
    };
    const { error } = editing
      ? await supabase.from("trainers").update(payload).eq("id", editing.id)
      : await supabase.from("trainers").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Trainer updated" : "Trainer added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["trainers"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this trainer?")) return;
    const { error } = await supabase.from("trainers").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Trainer removed");
    qc.invalidateQueries({ queryKey: ["trainers"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Meet the trainers behind HFC.</p>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="size-4" /> Add Trainer</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit trainer" : "New trainer"}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div><Label>Nickname</Label><Input value={form.nickname ?? ""} onChange={e => setForm({...form, nickname: e.target.value})} placeholder="e.g. Maestro" /></div>
                </div>
                <div><Label>HFC Code Name</Label><Input value={form.hfc_code_name ?? ""} onChange={e => setForm({...form, hfc_code_name: e.target.value})} placeholder="e.g. Falcon" /></div>
                <div><Label>Specialty</Label><Input value={form.specialty ?? ""} onChange={e => setForm({...form, specialty: e.target.value})} placeholder="Strength & Conditioning" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input type="tel" value={form.phone ?? ""} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 555 555 5555" /></div>
                  <div><Label>Alternate Phone</Label><Input type="tel" value={form.phone_alt ?? ""} onChange={e => setForm({...form, phone_alt: e.target.value})} placeholder="Optional" /></div>
                </div>
                <div><Label>Photo URL</Label><Input value={form.avatar_url ?? ""} onChange={e => setForm({...form, avatar_url: e.target.value})} placeholder="https://…" /></div>
                <div><Label>Bio</Label><Textarea rows={4} value={form.bio ?? ""} onChange={e => setForm({...form, bio: e.target.value})} /></div>
                <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search by name, nickname, code, specialty, phone…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as TrainerSort)}>
          <SelectTrigger className="w-[180px]"><ArrowUpDown className="size-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="nickname">Sort by Nickname</SelectItem>
            <SelectItem value="hfc_code_name">Sort by HFC Code</SelectItem>
            <SelectItem value="specialty">Sort by Specialty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {(trainers ?? [])
          .filter(t => {
            const q = search.trim().toLowerCase();
            if (!q) return true;
            return [t.name, t.nickname, t.hfc_code_name, t.specialty, t.phone, t.phone_alt, t.bio]
              .some(v => (v ?? "").toLowerCase().includes(q));
          })
          .slice()
          .sort((a, b) => ((a[sortBy] ?? "") as string).localeCompare(((b[sortBy] ?? "") as string)))
          .map(t => {
            const attachedGroups = trainerGroups?.[t.id] ?? [];
            return (
          <div key={t.id} className="rounded-xl border bg-card p-5 flex gap-4">
            <div className="size-16 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xl font-semibold shrink-0">
              {t.avatar_url ? <img src={t.avatar_url} alt="" className="size-full object-cover" /> : t.name.slice(0,1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {t.nickname && <span className="text-primary">{t.nickname} </span>}
                    {t.name}
                  </h3>
                  {t.hfc_code_name && <p className="text-[10px] uppercase tracking-wider text-gold">Code: {t.hfc_code_name}</p>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setGroupsDialogTrainer(t)} title="Manage groups">
                      <FolderKanban className="size-4 mr-1" /> Groups
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="size-4" /></Button>
                  </div>
                )}
              </div>
              {t.specialty && <p className="text-xs text-muted-foreground mt-1"><Dumbbell className="size-3 inline" /> {t.specialty}</p>}
              {(t.phone || t.phone_alt) && (
                <p className="text-xs text-muted-foreground mt-1">
                  📞 {[t.phone, t.phone_alt].filter(Boolean).join(" · ")}
                </p>
              )}
              {attachedGroups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {attachedGroups.map(g => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      <FolderKanban className="size-3 inline mr-1" />{g}
                    </span>
                  ))}
                </div>
              )}
              {t.bio && <p className="text-sm mt-2 line-clamp-4">{t.bio}</p>}
            </div>
          </div>
            );
          })}
        {!trainers?.length && <p className="text-muted-foreground text-center py-16 col-span-full">No trainers yet{isAdmin ? " — add the first one." : "."}</p>}
      </div>

      {groupsDialogTrainer && (
        <ManageTrainerGroupsDialog
          trainer={groupsDialogTrainer}
          open={!!groupsDialogTrainer}
          onClose={() => setGroupsDialogTrainer(null)}
        />
      )}
    </div>
  );
}

function GroupsContent({ isAdmin, isMentor }: { isAdmin: boolean; isMentor: boolean }) {
  const canManage = isAdmin || isMentor;
  const [memberDialogGroup, setMemberDialogGroup] = useState<Group | null>(null);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "description">("name");

  const { data: groups } = useQuery({
    queryKey: ["gallery-groups"],
    queryFn: async () => ((await supabase.from("gallery_groups").select("*").order("name")).data ?? []) as Group[],
  });

  const openNew = () => { setEditing(null); setForm({ name: "", description: "" }); setOpen(true); };
  const openEdit = (g: Group) => { setEditing(g); setForm({ name: g.name, description: g.description ?? "" }); setOpen(true); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, description: form.description || null };
    const { error } = editing
      ? await supabase.from("gallery_groups").update(payload).eq("id", editing.id)
      : await supabase.from("gallery_groups").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "Group updated" : "Group added");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["gallery-groups"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    const { error } = await supabase.from("gallery_groups").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["gallery-groups"] });
  };

  const filtered = (groups ?? [])
    .filter(g => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (g.name ?? "").toLowerCase().includes(q) || (g.description ?? "").toLowerCase().includes(q);
    })
    .slice()
    .sort((a, b) => ((a[sortBy] ?? "") as string).localeCompare(((b[sortBy] ?? "") as string)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-muted-foreground">Groups apply across HFC — Gallery tags, member assignments, and more.</p>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="size-4" /> Add Group</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit group" : "New group"}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Short description for this group" /></div>
                <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search groups…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "name" | "description")}>
          <SelectTrigger className="w-[200px]"><ArrowUpDown className="size-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="description">Sort by Description</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {filtered.map(g => (
          <div key={g.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold">{g.name}</h3>
                {g.description && <p className="text-sm text-muted-foreground mt-1">{g.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                {canManage && (
                  <Button size="sm" variant="outline" onClick={() => setMemberDialogGroup(g)} title="Manage members">
                    <UsersRound className="size-4 mr-1" /> Members
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil className="size-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(g.id)}><Trash2 className="size-4" /></Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {!filtered.length && <p className="text-muted-foreground text-center py-12 col-span-full">No groups found.</p>}
      </div>

      {memberDialogGroup && (
        <ManageGroupMembersDialog
          group={memberDialogGroup}
          open={!!memberDialogGroup}
          onClose={() => setMemberDialogGroup(null)}
        />
      )}
    </div>
  );
}

function MembersContent({ isAdmin, isMentor }: { isAdmin: boolean; isMentor: boolean }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"full_name" | "username" | "nickname" | "team">("full_name");

  const { data: members } = useQuery({
    queryKey: ["about-members"],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_all_profiles");
      return (data as any[]) ?? [];
    },
    enabled: isAdmin || isMentor,
  });

  const { data: groups } = useQuery({
    queryKey: ["gallery-groups"],
    queryFn: async () => (await supabase.from("gallery_groups").select("id, name").order("name")).data ?? [],
    enabled: isAdmin || isMentor,
  });

  const { data: mentors } = useQuery({
    queryKey: ["mentors-list"],
    enabled: isAdmin || isMentor,
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "mentor");
      const ids = (roles ?? []).map(r => r.user_id);
      if (!ids.length) return [];
      const { data } = await supabase.from("public_profiles").select("id, full_name, username").in("id", ids);
      return data ?? [];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ["all-user-roles"],
    enabled: isAdmin || isMentor,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      const map: Record<string, string[]> = {};
      for (const r of (data ?? [])) {
        (map[r.user_id] ||= []).push(r.role as string);
      }
      return map;
    },
  });

  if (!isAdmin && !isMentor) {
    return <p className="text-muted-foreground text-center py-16">Only admins and mentors can view the full member list.</p>;
  }

  const roleOf = (uid: string): "admin" | "mentor" | "user" => {
    const rs = allRoles?.[uid] ?? [];
    if (rs.includes("admin")) return "admin";
    if (rs.includes("mentor")) return "mentor";
    return "user";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (members ?? [])
      .filter(m =>
        !q ||
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.username ?? "").toLowerCase().includes(q) ||
        (m.nickname ?? "").toLowerCase().includes(q) ||
        (m.team ?? "").toLowerCase().includes(q) ||
        (m.phone ?? "").toLowerCase().includes(q)
      )
      .slice()
      .sort((a, b) => ((a[sortBy] ?? "") as string).localeCompare(((b[sortBy] ?? "") as string)));
  }, [members, search, sortBy]);

  const isAssigned = (m: any) => !!m.nickname && !!m.mentor_id && !!m.group_id;
  const unassigned = filtered.filter((m: any) => !isAssigned(m));
  const assigned = filtered.filter((m: any) => isAssigned(m));

  const startEdit = (m: any) => { setEditingId(m.id); setDraft(m.nickname ?? ""); };
  const cancel = () => { setEditingId(null); setDraft(""); };
  const saveNickname = async (id: string, value: string | null) => {
    const { error } = await supabase.from("profiles").update({ nickname: value }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Nickname saved");
    cancel();
    qc.invalidateQueries({ queryKey: ["about-members"] });
  };

  const updateAssignment = async (userId: string, field: "mentor_id" | "group_id", value: string | null) => {
    const patch: Record<string, string | null> = { [field]: value };
    const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["about-members"] });
  };

  const updateRole = async (userId: string, newRole: "user" | "mentor" | "admin") => {
    if (!isAdmin) { toast.error("Only admins can change roles"); return; }
    const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["admin", "mentor", "user"]);
    if (delErr) { toast.error(delErr.message); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["all-user-roles"] });
  };

  const renderRow = (m: any, locked: boolean) => {
    const currentRole = roleOf(m.id);
    return (
    <div key={m.id} className="flex items-center gap-3 p-3 flex-wrap">
      <div className="size-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold shrink-0">
        {m.avatar_url ? <img src={m.avatar_url} alt="" className="size-full object-cover" /> : (m.full_name || toTitleCase(m.username) || "?").slice(0,1).toUpperCase()}
      </div>
      <div className="flex-1 min-w-[180px]">
        <p className="font-medium truncate">
          {m.nickname && <span className="text-primary">{m.nickname} </span>}
          {m.full_name || toTitleCase(m.username)}
        </p>
        <p className="text-xs text-muted-foreground truncate">@{toTitleCase(m.username)} · {m.team ?? "—"}</p>
      </div>

      <Select value={currentRole} onValueChange={(v) => updateRole(m.id, v as any)} disabled={!isAdmin}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="mentor">Mentor-Trainer</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>

      <Select value={m.mentor_id ?? "none"} onValueChange={(v) => updateAssignment(m.id, "mentor_id", v === "none" ? null : v)} disabled={locked && !!m.mentor_id}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Mentor-Trainer" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Mentor-Trainer —</SelectItem>
          {(mentors ?? []).map((mt: any) => <SelectItem key={mt.id} value={mt.id}>{mt.full_name || toTitleCase(mt.username)}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={m.group_id ?? "none"} onValueChange={(v) => updateAssignment(m.id, "group_id", v === "none" ? null : v)} disabled={locked && !!m.group_id}>
        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Group" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">— Group —</SelectItem>
          {(groups ?? []).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
        </SelectContent>
      </Select>

      <div className="shrink-0">
        {editingId === m.id ? (
          <div className="flex items-center gap-1">
            <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Nickname" className="h-8 w-32" autoFocus />
            <Button size="sm" variant="ghost" onClick={() => saveNickname(m.id, draft.trim() || null)}><Check className="size-4" /></Button>
            <Button size="sm" variant="ghost" onClick={cancel}><X className="size-4" /></Button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => startEdit(m)}>
              <Pencil className="size-3 mr-1" /> {m.nickname ? "Edit" : "Add"} nickname
            </Button>
            {m.nickname && (
              <Button size="sm" variant="ghost" onClick={() => saveNickname(m.id, null)} title="Clear nickname">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-muted-foreground">A member is <em>Assigned</em> only when role, Mentor-Trainer, Group, and nickname are all set. Only admins can change roles.</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search by name, nickname, username, team, phone…" value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]"><ArrowUpDown className="size-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full_name">Sort by Name</SelectItem>
            <SelectItem value="username">Sort by Username</SelectItem>
            <SelectItem value="nickname">Sort by Nickname</SelectItem>
            <SelectItem value="team">Sort by Team</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Unassigned members ({unassigned.length})</h3>
        <div className="rounded-xl border bg-card divide-y">
          {unassigned.map((m: any) => renderRow(m, false))}
          {!unassigned.length && <p className="p-6 text-center text-muted-foreground text-sm">None.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-wider text-muted-foreground">Assigned members ({assigned.length})</h3>
        <div className="rounded-xl border bg-card divide-y">
          {assigned.map((m: any) => renderRow(m, !isAdmin))}
          {!assigned.length && <p className="p-6 text-center text-muted-foreground text-sm">None.</p>}
        </div>
      </section>
    </div>
  );
}

// ===== Manage members of a group (admin/mentor) =====
function ManageGroupMembersDialog({ group, open, onClose }: { group: Group; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ["all-profiles-for-group-mgmt"],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_all_profiles");
      return (data as any[]) ?? [];
    },
  });

  if (members && !initialised) {
    const initial = new Set<string>();
    for (const m of members) if (m.group_id === group.id) initial.add(m.id);
    setSelected(initial);
    setInitialised(true);
  }

  const filtered = (members ?? []).filter((m: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.full_name, m.username, m.nickname].some((v: string | null) => (v ?? "").toLowerCase().includes(q));
  });

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!members) return;
    setSaving(true);
    const original = new Set<string>(members.filter((m: any) => m.group_id === group.id).map((m: any) => m.id));
    const toAdd = [...selected].filter(id => !original.has(id));
    const toRemove = [...original].filter(id => !selected.has(id));
    try {
      if (toAdd.length) {
        const { error } = await supabase.from("profiles").update({ group_id: group.id }).in("id", toAdd);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase.from("profiles").update({ group_id: null }).in("id", toRemove);
        if (error) throw error;
      }
      toast.success(`Updated: +${toAdd.length} / −${toRemove.length}`);
      qc.invalidateQueries({ queryKey: ["all-profiles-for-group-mgmt"] });
      qc.invalidateQueries({ queryKey: ["about-members"] });
      qc.invalidateQueries({ queryKey: ["trainer-groups-map"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update group members");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage members — {group.name}</DialogTitle>
        </DialogHeader>
        <Input placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        <p className="text-xs text-muted-foreground">{selected.size} selected · check to add, uncheck to remove.</p>
        <div className="flex-1 overflow-y-auto rounded border divide-y">
          {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading…</p>}
          {filtered.map((m: any) => {
            const otherGroup = m.group_id && m.group_id !== group.id;
            return (
              <label key={m.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30">
                <Checkbox checked={selected.has(m.id)} onCheckedChange={() => toggle(m.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    {m.nickname && <span className="text-primary">{m.nickname} </span>}
                    {m.full_name || toTitleCase(m.username)}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    @{toTitleCase(m.username)}{otherGroup ? " · in another group" : ""}
                  </p>
                </div>
              </label>
            );
          })}
          {!isLoading && !filtered.length && <p className="p-4 text-sm text-muted-foreground text-center">No members.</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ===== Manage groups attached to a trainer (admin only) =====
function ManageTrainerGroupsDialog({ trainer, open, onClose }: { trainer: Trainer; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const { data: groups } = useQuery({
    queryKey: ["gallery-groups"],
    queryFn: async () => ((await supabase.from("gallery_groups").select("id, name").order("name")).data ?? []) as { id: string; name: string }[],
  });

  const { data: profiles } = useQuery({
    queryKey: ["all-profiles-for-trainer-mgmt"],
    queryFn: async () => {
      const { data } = await supabase.rpc("list_all_profiles");
      return (data as any[]) ?? [];
    },
  });

  if (profiles && !initialised) {
    const initial = new Set<string>();
    for (const p of profiles) {
      if (p.trainer_id === trainer.id && p.group_id) initial.add(p.group_id);
    }
    setSelected(initial);
    setInitialised(true);
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!profiles) return;
    setSaving(true);
    const originallyAttached = new Set<string>();
    for (const p of profiles) {
      if (p.trainer_id === trainer.id && p.group_id) originallyAttached.add(p.group_id);
    }
    const toAttach = [...selected].filter(id => !originallyAttached.has(id));
    const toDetach = [...originallyAttached].filter(id => !selected.has(id));
    try {
      for (const gid of toAttach) {
        const { error } = await supabase.from("profiles").update({ trainer_id: trainer.id }).eq("group_id", gid);
        if (error) throw error;
      }
      for (const gid of toDetach) {
        const { error } = await supabase.from("profiles").update({ trainer_id: null }).eq("group_id", gid).eq("trainer_id", trainer.id);
        if (error) throw error;
      }
      toast.success(`Updated: +${toAttach.length} / −${toDetach.length}`);
      qc.invalidateQueries({ queryKey: ["trainer-groups-map"] });
      qc.invalidateQueries({ queryKey: ["all-profiles-for-trainer-mgmt"] });
      qc.invalidateQueries({ queryKey: ["about-members"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update trainer groups");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage groups — {trainer.nickname ? `${trainer.nickname} ` : ""}{trainer.name}</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Checking a group sets this trainer for every member of that group. Unchecking clears the trainer for those members.
        </p>
        <div className="flex-1 overflow-y-auto rounded border divide-y">
          {(groups ?? []).map(g => (
            <label key={g.id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted/30">
              <Checkbox checked={selected.has(g.id)} onCheckedChange={() => toggle(g.id)} />
              <span className="text-sm">{g.name}</span>
            </label>
          ))}
          {!groups?.length && <p className="p-4 text-sm text-muted-foreground text-center">No groups exist yet.</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
