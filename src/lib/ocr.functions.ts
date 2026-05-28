import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MetricSchema = z.object({
  pushups: z.number().nullable(),
  plank_seconds: z.number().nullable(),
  squats: z.number().nullable(),
  run_100m_seconds: z.number().nullable(),
  run_5k_seconds: z.number().nullable(),
});

export const ocrProgressImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      imageUrl: z.string().url().max(2048),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Extract fitness performance test metrics from the image. Return only numbers for fields you can confidently read. Use null for missing/unclear values. Units: pushups=reps, plank_seconds=seconds, squats=seconds held, run_100m_seconds=seconds, run_5k_seconds=total seconds (convert mm:ss if needed).",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the metrics from this progress test screenshot." },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_metrics",
              description: "Report extracted fitness metrics",
              parameters: {
                type: "object",
                properties: {
                  pushups: { type: ["number", "null"] },
                  plank_seconds: { type: ["number", "null"] },
                  squats: { type: ["number", "null"] },
                  run_100m_seconds: { type: ["number", "null"] },
                  run_5k_seconds: { type: ["number", "null"] },
                },
                required: ["pushups", "plank_seconds", "squats", "run_100m_seconds", "run_5k_seconds"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_metrics" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit exceeded — try again in a moment");
      if (res.status === 402) throw new Error("AI credits exhausted — please add funds in Settings → Workspace → Usage");
      const t = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI did not return structured metrics");
    const parsed = MetricSchema.safeParse(JSON.parse(args));
    if (!parsed.success) throw new Error("AI returned invalid metric shape");
    return parsed.data;
  });
