import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Users, Brain, Activity, Calendar } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Holistic Fitness Club — Train. Reflect. Rise." },
      { name: "description", content: "HFC is a holistic training community. Codex principles, progress tracking, leaderboards, mentorship and more." },
      { property: "og:title", content: "Holistic Fitness Club — Train. Reflect. Rise." },
      { property: "og:description", content: "Join a holistic training community. Daily codex, progress tracking, leaderboards and mentor chat." },
      { property: "og:url", content: "https://hfc-zenith-flow.lovable.app/" },
      { name: "twitter:title", content: "Holistic Fitness Club" },
      { name: "twitter:description", content: "Train. Reflect. Rise." },
    ],
    links: [{ rel: "canonical", href: "https://hfc-zenith-flow.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="text-white font-display font-bold text-xl tracking-tight">HFC</div>
        <nav className="flex gap-2">
          <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white"><Link to="/login">Login</Link></Button>
          <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90"><Link to="/signup">Join HFC</Link></Button>
        </nav>
      </header>

      <main>
      <section className="relative min-h-[88vh] flex items-center justify-center px-6 text-center" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-3xl text-white">
          <p className="uppercase tracking-[0.3em] text-gold text-xs mb-6">Holistic Fitness Club</p>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05]">
            Train. Reflect. <span className="text-gold">Rise.</span>
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto">
            A community built on eight principles. Track your codex, log your progress, compete on the leaderboard, and grow with mentors.
          </p>
          <div className="mt-10 flex gap-3 justify-center">
            <Button asChild size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90 shadow-[var(--shadow-gold)]"><Link to="/signup">Get Started</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent"><Link to="/login">I have an account</Link></Button>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Everything your brigade needs</h2>
        <p className="text-center text-muted-foreground mb-14 max-w-xl mx-auto">From daily codex to community events — one home for your holistic journey.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { i: Flame, t: "Daily Codex", d: "Track 8 principles, build streaks." },
            { i: Activity, t: "Progress Tracker", d: "Pushups, pullups, runs, plank." },
            { i: Trophy, t: "Leaderboards", d: "Codex, progress, brain fitness." },
            { i: Calendar, t: "Community Events", d: "HFD, Intellectual Council and more." },
            { i: Users, t: "Mentor Chat", d: "Direct Q&A with your coaches." },
            { i: Brain, t: "Health Tools", d: "BMI, BMR, blood report logs." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-xl border bg-card p-6 hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4"><Icon className="size-5" /></div>
              <h3 className="font-semibold mb-1">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>
      </main>


      <footer className="border-t py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Holistic Fitness Club
      </footer>
    </div>
  );
}
