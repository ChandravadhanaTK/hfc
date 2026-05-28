import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "hfc_session_id";
let currentSessionId: string | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const SCREEN_LABELS: Record<string, string> = {
  "/app": "Dashboard",
  "/app/codex": "Codex",
  "/app/progress": "Progress Tracker",
  "/app/leaderboard": "Leaderboard",
  "/app/community": "Community",
  "/app/gallery": "Gallery",
  "/app/achievements": "Achievements",
  "/app/chat": "Mentor Chat",
  "/app/health": "Health Tools",
  "/app/payments": "Payments",
  "/app/profile": "Profile",
  "/app/admin": "Admin",
};

export function screenLabel(path: string): string {
  if (SCREEN_LABELS[path]) return SCREEN_LABELS[path];
  for (const [k, v] of Object.entries(SCREEN_LABELS)) {
    if (k !== "/app" && path.startsWith(k)) return v;
  }
  return path;
}

export async function startSession(userId: string) {
  if (typeof window === "undefined") return;
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) { currentSessionId = existing; }
  else {
    const { data, error } = await supabase
      .from("user_sessions")
      .insert({ user_id: userId, user_agent: navigator.userAgent })
      .select("id").single();
    if (error || !data) return;
    currentSessionId = data.id;
    sessionStorage.setItem(SESSION_KEY, data.id);
  }
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => heartbeat(), 60_000);
  window.addEventListener("beforeunload", endSessionSync);
}

async function heartbeat() {
  if (!currentSessionId) return;
  const now = new Date();
  const started = await supabase.from("user_sessions").select("started_at").eq("id", currentSessionId).single();
  const startedAt = started.data ? new Date(started.data.started_at) : now;
  const duration = Math.round((now.getTime() - startedAt.getTime()) / 1000);
  await supabase.from("user_sessions").update({ last_active_at: now.toISOString(), duration_seconds: duration }).eq("id", currentSessionId);
}

function endSessionSync() {
  if (!currentSessionId) return;
  const now = new Date().toISOString();
  navigator.sendBeacon?.("/"); // no-op fallback
  void supabase.from("user_sessions").update({ ended_at: now, last_active_at: now }).eq("id", currentSessionId);
}

export async function endSession() {
  if (!currentSessionId) return;
  const now = new Date();
  await supabase.from("user_sessions").update({ ended_at: now.toISOString(), last_active_at: now.toISOString() }).eq("id", currentSessionId);
  sessionStorage.removeItem(SESSION_KEY);
  currentSessionId = null;
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

export async function trackScreen(userId: string, path: string) {
  if (typeof window === "undefined") return;
  await supabase.from("feature_events").insert({
    user_id: userId,
    session_id: currentSessionId,
    screen: screenLabel(path),
    feature: "screen_view",
    metadata: { path },
  });
}

export async function trackFeature(userId: string, screen: string, feature: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  await supabase.from("feature_events").insert({
    user_id: userId,
    session_id: currentSessionId,
    screen,
    feature,
    metadata: (metadata ?? null) as never,
  });
}
