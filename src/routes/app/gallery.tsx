import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, ImageIcon } from "lucide-react";
import { GroupMultiSelect } from "@/components/group-multi-select";

export const Route = createFileRoute("/app/gallery")({ component: GalleryPage });

const CATS = ["All", "General", "Workout", "Post Workout Pics", "Events", "Seminars", "Fitadels", "Birthday Diaries", "HFD"];
const isVideo = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url);

function GalleryPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState("All");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ image_url: "", caption: "", category: "General", group_id: "" });

  const { data: groups } = useQuery({
    queryKey: ["gallery-groups"],
    queryFn: async () => (await supabase.from("gallery_groups").select("*").order("sort_order")).data ?? [],
  });

  const { data: photos } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => (await supabase.from("gallery").select("*, gallery_groups(name)").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = (photos ?? []).filter(p => {
    if (cat !== "All" && p.category !== cat) return false;
    if (groupIds.length > 0 && (!p.group_id || !groupIds.includes(p.group_id))) return false;
    return true;
  });

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const payload: any = { image_url: form.image_url, caption: form.caption, category: form.category, uploaded_by: user!.id };
    if (form.group_id) payload.group_id = form.group_id;
    const { error } = await supabase.from("gallery").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    setOpen(false); setForm({ image_url: "", caption: "", category: "General", group_id: "" });
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  const showGroupFilter = cat === "Post Workout Pics" || cat === "All";

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-bold">Gallery</h1>
          <p className="text-muted-foreground mt-2">Moments from the journey. Manage groups from the About screen.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4" /> Add photo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add photo</DialogTitle></DialogHeader>
              <form onSubmit={add} className="space-y-3">
                <div><Label>Image or Video URL</Label><Input value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} required /></div>
                <div><Label>Caption</Label><Input value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} /></div>
                <div><Label>Category</Label>
                  <select className="w-full border rounded-md h-10 px-3 bg-background" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATS.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><Label>Tag a group (optional)</Label>
                  <select className="w-full border rounded-md h-10 px-3 bg-background" value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})}>
                    <option value="">— None —</option>
                    {groups?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <Button type="submit" className="w-full">Upload</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="flex gap-2 flex-wrap">
        {CATS.map(c => (
          <button key={c} onClick={() => { setCat(c); setGroupIds([]); }} className={`px-3 py-1.5 rounded-full text-sm ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c}</button>
        ))}
      </div>

      {showGroupFilter && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground">Group:</span>
          <GroupMultiSelect groups={(groups ?? []) as any} selected={groupIds} onChange={setGroupIds} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered?.map((p: any) => (
          <div key={p.id} className="rounded-xl overflow-hidden border bg-card group">
            <div className="aspect-square bg-muted overflow-hidden">
              {isVideo(p.image_url) ? (
                <video src={p.image_url} controls className="w-full h-full object-cover" />
              ) : (
                <img src={p.image_url} alt={p.caption ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              )}
            </div>
            <div className="p-2 space-y-1">
              {p.caption && <p className="text-xs text-muted-foreground truncate">{p.caption}</p>}
              {p.gallery_groups?.name && <p className="text-[10px] text-primary font-medium">#{p.gallery_groups.name}</p>}
            </div>
          </div>
        ))}
        {!filtered?.length && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <ImageIcon className="size-12 mx-auto mb-3 opacity-30" />
            <p>No photos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
