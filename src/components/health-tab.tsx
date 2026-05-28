import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function HealthTab() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_full_profile", { _id: uid });
      return (data as any[])?.[0] ?? null;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["health-logs", uid],
    queryFn: async () => (await supabase.from("health_logs").select("*").eq("user_id", uid).order("log_date", { ascending: false })).data ?? [],
  });

  const [calc, setCalc] = useState({ weight: profile?.weight_kg?.toString() ?? "", height: profile?.height_cm?.toString() ?? "", age: "30", sex: "male" });

  const weight = parseFloat(calc.weight) || 0;
  const height = parseFloat(calc.height) || 0;
  const age = parseFloat(calc.age) || 0;
  const bmi = weight && height ? weight / Math.pow(height / 100, 2) : 0;
  const bmr = weight && height && age
    ? (calc.sex === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161)
    : 0;

  const [blood, setBlood] = useState({ hemoglobin: "", glucose: "", cholesterol: "", file_url: "" });
  const [uploading, setUploading] = useState(false);
  const onBloodFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `${uid}/blood-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("health-uploads").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("health-uploads").getPublicUrl(path);
      setBlood(b => ({ ...b, file_url: pub.publicUrl }));
      toast.success("Report uploaded");
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  };
  const submitBlood = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("health_logs").insert({ user_id: uid, log_type: "blood_report", data: blood });
    if (error) { toast.error(error.message); return; }
    toast.success("Blood report logged");
    setBlood({ hemoglobin: "", glucose: "", cholesterol: "", file_url: "" });
    qc.invalidateQueries({ queryKey: ["health-logs", uid] });
  };

  const lastBlood = logs?.find(l => l.log_type === "blood_report");
  const daysSinceBlood = lastBlood ? Math.floor((Date.now() - new Date(lastBlood.log_date).getTime()) / 86400000) : null;
  const dueBlood = daysSinceBlood == null || daysSinceBlood > 180;

  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Calculator</h2>
        <div className="grid sm:grid-cols-4 gap-3">
          <div><Label>Weight (kg)</Label><Input value={calc.weight} onChange={e => setCalc({...calc, weight: e.target.value})} /></div>
          <div><Label>Height (cm)</Label><Input value={calc.height} onChange={e => setCalc({...calc, height: e.target.value})} /></div>
          <div><Label>Age</Label><Input value={calc.age} onChange={e => setCalc({...calc, age: e.target.value})} /></div>
          <div><Label>Sex</Label>
            <select className="w-full h-10 border rounded-md px-3 bg-background" value={calc.sex} onChange={e => setCalc({...calc, sex: e.target.value})}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <Tile label="BMI" value={bmi ? bmi.toFixed(1) : "—"} sub={bmi ? bmiLabel(bmi) : ""} />
          <Tile label="BMR" value={bmr ? Math.round(bmr).toString() : "—"} sub="kcal/day" />
          <Tile label="Maintenance" value={bmr ? Math.round(bmr * 1.4).toString() : "—"} sub="kcal/day" />
        </div>
      </div>

      <div className={`rounded-xl border p-6 ${dueBlood ? "bg-gold/10 border-gold" : "bg-card"}`}>
        <h2 className="font-display font-semibold text-lg mb-1">Blood Report</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {lastBlood ? `Last logged ${daysSinceBlood} days ago. ${dueBlood ? "Due for a new check-up." : "You're on track."}` : "Log every 6 months."}
        </p>
        <form onSubmit={submitBlood} className="grid sm:grid-cols-3 gap-3">
          <div><Label>Hemoglobin</Label><Input value={blood.hemoglobin} onChange={e => setBlood({...blood, hemoglobin: e.target.value})} /></div>
          <div><Label>Glucose</Label><Input value={blood.glucose} onChange={e => setBlood({...blood, glucose: e.target.value})} /></div>
          <div><Label>Cholesterol</Label><Input value={blood.cholesterol} onChange={e => setBlood({...blood, cholesterol: e.target.value})} /></div>
          <div className="sm:col-span-3">
            <Label>Upload full report (PDF / image)</Label>
            <Input type="file" accept="image/*,application/pdf" disabled={uploading}
              onChange={e => { const f = e.target.files?.[0]; if (f) onBloodFile(f); }} />
            {blood.file_url && <a href={blood.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View uploaded file</a>}
          </div>
          <Button type="submit" className="sm:col-span-3">Log report</Button>
        </form>
      </div>

      <BrainFitness uid={uid} />

      <div>
        <h2 className="font-display font-semibold text-lg mb-3">History</h2>
        <div className="rounded-xl border bg-card divide-y">
          {logs?.map(l => (
            <div key={l.id} className="p-4 flex justify-between text-sm">
              <span>{l.log_type}</span>
              <span className="text-muted-foreground">{new Date(l.log_date).toLocaleDateString()}</span>
            </div>
          ))}
          {!logs?.length && <p className="p-6 text-center text-muted-foreground text-sm">No logs yet.</p>}
        </div>
      </div>
    </div>
  );
}

function BrainFitness({ uid }: { uid: string }) {
  const qc = useQueryClient();
  const { data: books } = useQuery({
    queryKey: ["books", uid],
    queryFn: async () => (await supabase.from("book_log").select("*").eq("user_id", uid).order("created_at", { ascending: false })).data ?? [],
  });
  const [book, setBook] = useState({ title: "", one_liner: "", start_date: "", end_date: "", public_url: "", status: "reading" });
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("book_log").insert({ user_id: uid, ...book, end_date: book.end_date || null, start_date: book.start_date || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Book logged");
    setBook({ title: "", one_liner: "", start_date: "", end_date: "", public_url: "", status: "reading" });
    qc.invalidateQueries({ queryKey: ["books", uid] });
  };
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="font-display font-semibold text-lg mb-1">Brain Fitness</h2>
      <p className="text-sm text-muted-foreground mb-4">What are you reading?</p>
      <form onSubmit={add} className="grid sm:grid-cols-2 gap-3 mb-4">
        <div><Label>Book name</Label><Input value={book.title} onChange={e => setBook({...book, title: e.target.value})} required /></div>
        <div><Label>One-liner</Label><Input value={book.one_liner} onChange={e => setBook({...book, one_liner: e.target.value})} placeholder="What's it about?" /></div>
        <div><Label>Start date</Label><Input type="date" value={book.start_date} onChange={e => setBook({...book, start_date: e.target.value})} /></div>
        <div><Label>End date</Label><Input type="date" value={book.end_date} onChange={e => setBook({...book, end_date: e.target.value})} /></div>
        <div className="sm:col-span-2"><Label>Public link</Label><Input type="url" value={book.public_url} onChange={e => setBook({...book, public_url: e.target.value})} placeholder="https://…" /></div>
        <Button type="submit" className="sm:col-span-2">Add book</Button>
      </form>
      <div className="space-y-2">
        {books?.map((b: any) => (
          <div key={b.id} className="p-3 border rounded-lg text-sm">
            <div className="flex justify-between gap-2">
              <p className="font-medium">{b.title}</p>
              <span className="text-xs text-muted-foreground capitalize">{b.status}</span>
            </div>
            {b.one_liner && <p className="text-muted-foreground text-xs mt-1">{b.one_liner}</p>}
            <p className="text-[11px] text-muted-foreground mt-1">
              {b.start_date && `Started ${b.start_date}`}
              {b.end_date && ` • Finished ${b.end_date}`}
            </p>
            {b.public_url && <a href={b.public_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">Link →</a>}
          </div>
        ))}
        {!books?.length && <p className="text-xs text-muted-foreground">No books logged yet.</p>}
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
function bmiLabel(b: number) {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Healthy";
  if (b < 30) return "Overweight";
  return "Obese";
}
