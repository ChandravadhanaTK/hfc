import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const NotifKindSchema = z.enum(["event", "activity", "rsvp", "achievement"]);

/**
 * Fan-out SMS via Twilio (connector gateway) to all users who:
 *  - have a phone number set on their profile
 *  - have <kind>_sms enabled in notification_preferences
 *
 * Silently no-ops if Twilio is not connected yet (TWILIO_API_KEY missing).
 * In-app notifications continue to fire via database triggers regardless.
 */
export const dispatchSms = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      kind: NotifKindSchema,
      title: z.string().min(1).max(200),
      body: z.string().max(500).optional(),
      excludeUserId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Authorization: only admins and mentors may blast SMS
    const { data: roles, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "mentor"]);
    if (roleErr) throw new Error(roleErr.message);
    if (!roles || roles.length === 0) {
      throw new Error("Forbidden: admin or mentor role required");
    }

    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
    const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_FROM) {
      return { sent: 0, skipped: "twilio_not_configured" as const };
    }


    const channelCol = `${data.kind}_sms`;
    const { data: prefs, error } = await supabaseAdmin
      .from("notification_preferences")
      .select(`user_id, ${channelCol}, profiles!inner(phone)`)
      .eq(channelCol, true);
    if (error) throw new Error(error.message);

    const recipients = (prefs ?? [])
      .filter((p: any) => p.user_id !== data.excludeUserId)
      .map((p: any) => p.profiles?.phone)
      .filter((phone: string | null | undefined): phone is string => !!phone && /^\+\d{8,15}$/.test(phone));

    if (!recipients.length) return { sent: 0, skipped: "no_recipients" as const };

    const message = data.body ? `${data.title}\n${data.body}` : data.title;
    const truncated = message.slice(0, 320);

    let sent = 0;
    for (const to of recipients) {
      try {
        const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": TWILIO_API_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: TWILIO_FROM, Body: truncated }),
        });
        if (res.ok) sent++;
        else console.error(`Twilio send failed [${res.status}] for ${to}`);
      } catch (err) {
        console.error("Twilio send error", err);
      }
    }
    return { sent, total: recipients.length };
  });
