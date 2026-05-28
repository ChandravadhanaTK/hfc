import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, MessageSquare, Mail } from "lucide-react";

const KINDS = [
  { k: "event", label: "Events", desc: "New events posted by admins" },
  { k: "activity", label: "Activities", desc: "User-created activities" },
  { k: "rsvp", label: "RSVPs", desc: "Someone RSVPs to your event" },
  { k: "achievement", label: "Achievements", desc: "Achievement unlocks & comments" },
] as const;

const CHANNELS = [
  { c: "inapp", label: "In-app", icon: Bell },
  { c: "sms", label: "SMS", icon: MessageSquare },
  { c: "email", label: "Email", icon: Mail },
] as const;

type PrefRow = Record<string, boolean | string | null>;

export function NotificationPreferences() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [form, setForm] = useState<PrefRow>({});

  const { data: prefs } = useQuery({
    queryKey: ["notif-prefs", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) return data as PrefRow;
      // first-time fallback (trigger should've created it, but just in case)
      const { data: created } = await supabase
        .from("notification_preferences")
        .insert({ user_id: uid })
        .select()
        .single();
      return created as PrefRow;
    },
  });

  useEffect(() => { if (prefs) setForm(prefs); }, [prefs]);

  const save = async () => {
    const upd: Record<string, boolean> = {};
    for (const k of KINDS) for (const c of CHANNELS) {
      const key = `${k.k}_${c.c}`;
      upd[key] = !!form[key];
    }
    const { error } = await supabase
      .from("notification_preferences")
      .update(upd as never)
      .eq("user_id", uid);
    if (error) { toast.error(error.message); return; }
    toast.success("Notification preferences saved");
    qc.invalidateQueries({ queryKey: ["notif-prefs", uid] });
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="font-display font-semibold mb-1">Notification preferences</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Choose how you want to be alerted. SMS requires a phone number on your profile.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-3 pr-3">Type</th>
              {CHANNELS.map(c => (
                <th key={c.c} className="pb-3 px-3">
                  <div className="flex items-center gap-1.5"><c.icon className="size-3.5" />{c.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {KINDS.map(k => (
              <tr key={k.k} className="border-t">
                <td className="py-3 pr-3">
                  <Label className="font-medium">{k.label}</Label>
                  <p className="text-xs text-muted-foreground">{k.desc}</p>
                </td>
                {CHANNELS.map(c => {
                  const key = `${k.k}_${c.c}`;
                  return (
                    <td key={c.c} className="px-3">
                      <Switch
                        checked={!!form[key]}
                        onCheckedChange={(v) => setForm({ ...form, [key]: v })}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button onClick={save} className="mt-4">Save preferences</Button>
    </div>
  );
}
