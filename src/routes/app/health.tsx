import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import HealthTab from "@/components/health-tab";
import CalorieTab from "@/components/calorie-tab";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/health")({ component: HealthPage });

const tabs = [
  { id: "health", label: "Health" },
  { id: "calorie", label: "Calorie Counter" },
];

function HealthPage() {
  const [activeTab, setActiveTab] = useState("health");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Health Tools</h1>
        <p className="text-muted-foreground mt-2">BMI, BMR, calories, blood reports.</p>
      </header>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "health" && <HealthTab />}
      {activeTab === "calorie" && <CalorieTab />}
    </div>
  );
}
