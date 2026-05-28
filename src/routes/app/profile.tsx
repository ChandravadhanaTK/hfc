import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NotificationPreferences } from "@/components/notification-preferences";

export const Route = createFileRoute("/app/profile")({ component: ProfilePage });

const F: { k: string; l: string; type?: string; section: string }[] = [
  { k: "full_name", l: "Full name", section: "Account" },
  { k: "username", l: "Username", section: "Account" },
  { k: "birthday", l: "Birthday", type: "date", section: "Account" },
  { k: "social_handle", l: "Social handle", section: "Account" },
  { k: "height_cm", l: "Height (cm)", type: "number", section: "Health" },
  { k: "weight_kg", l: "Weight (kg)", type: "number", section: "Health" },
  { k: "sleep_hours", l: "Sleep (hrs)", type: "number", section: "Health" },
  { k: "past_injuries", l: "Past injuries / surgeries", section: "Health" },
  { k: "medications", l: "Medications", section: "Health" },
  { k: "eating_habits", l: "Eating habits", section: "Nutrition" },
  { k: "hydration_liters", l: "Hydration (L/day)", type: "number", section: "Nutrition" },
  { k: "allergies", l: "Allergies", section: "Nutrition" },
  { k: "diet", l: "Diet (veg/non-veg)", section: "Nutrition" },
  { k: "activity_level", l: "Daily activity level", section: "Fitness" },
  { k: "fitness_experience", l: "Previous experience", section: "Fitness" },
  { k: "fitness_goals", l: "Goals", section: "Fitness" },
];

function ProfilePage() {
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
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const save = async () => {
    const upd: any = {};
    for (const f of F) {
      const v = form[f.k];
      upd[f.k] = v === "" ? null : f.type === "number" ? (v === null || v === undefined ? null : Number(v)) : v;
    }
    const { error } = await supabase.from("profiles").update(upd).eq("id", uid);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile", uid] });
  };

  const sections = Array.from(new Set(F.map(f => f.section)));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">Keep your health, nutrition, and fitness info up to date.</p>
      </header>

      {sections.map(s => (
        <div key={s} className="rounded-xl border bg-card p-6">
          <h2 className="font-display font-semibold mb-4">{s}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {F.filter(f => f.section === s).map(f => (
              <div key={f.k} className={f.l.length > 25 ? "sm:col-span-2" : ""}>
                <Label>{f.l}</Label>
                {f.k === "past_injuries" || f.k === "fitness_goals" || f.k === "eating_habits"
                  ? <Textarea rows={2} value={form[f.k] ?? ""} onChange={e => setForm({...form, [f.k]: e.target.value})} />
                  : <Input type={f.type ?? "text"} value={form[f.k] ?? ""} onChange={e => setForm({...form, [f.k]: e.target.value})} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <NotificationPreferences />

      <Button onClick={save} size="lg">Save profile</Button>
    </div>
  );
}
