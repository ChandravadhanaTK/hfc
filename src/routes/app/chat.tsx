import { createFileRoute, useSearch } from "@tanstack/react-router";
import { ChatPanel } from "@/components/chat-panel";

type Search = { dm?: string };

export const Route = createFileRoute("/app/chat")({
  component: ChatPage,
  validateSearch: (s: Record<string, unknown>): Search => ({ dm: typeof s.dm === "string" ? s.dm : undefined }),
});

function ChatPage() {
  const search = useSearch({ from: "/app/chat" }) as Search;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Mentor Chat</h1>
        <p className="text-muted-foreground mt-2">Ask, debate, connect.</p>
      </header>
      <ChatPanel initialDm={search.dm ?? null} />
    </div>
  );
}
