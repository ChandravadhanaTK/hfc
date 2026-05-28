import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ResultSchema = z.object({
  meal: z.string(),
  calories: z.number(),
});

export const estimateCalories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ imageUrl: z.string().url().max(4096) }).parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You estimate total calories in food photos. Be concise." },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this meal and estimate total calories." },
              { type: "image_url", image_url: { url: data.imageUrl } },
            ],
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_meal",
            description: "Report identified meal and calorie estimate",
            parameters: {
              type: "object",
              properties: {
                meal: { type: "string", description: "short meal name" },
                calories: { type: "number", description: "total estimated calories" },
              },
              required: ["meal", "calories"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_meal" } },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit — try again");
      if (res.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error ${res.status}`);
    }
    const json = await res.json();
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("AI did not return result");
    const parsed = ResultSchema.safeParse(JSON.parse(args));
    if (!parsed.success) throw new Error("Invalid AI response");
    return parsed.data;
  });
