import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Construction } from "lucide-react";

export const Route = createFileRoute("/app/payments")({ component: Payments });

function Payments() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-bold">Payments & Referrals</h1>
        <p className="text-muted-foreground mt-2">Manage fees, redeem credits, invite friends.</p>
      </header>

      <div
        className="rounded-2xl border-2 border-dashed p-12 text-center space-y-4"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-background/20 backdrop-blur">
          <Construction className="size-10 text-primary-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-primary-foreground">Work in Progress</h2>
        <p className="text-primary-foreground/80 max-w-md mx-auto">
          We're building a smoother payment experience — secure checkout, automatic
          credit redemption and one-click referral rewards. Check back soon.
        </p>
        <p className="text-primary-foreground/60 text-sm flex items-center justify-center gap-2">
          <Wrench className="size-4" /> Under active development
        </p>
      </div>
    </div>
  );
}
