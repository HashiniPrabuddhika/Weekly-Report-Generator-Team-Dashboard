"use client";

import * as React from "react";
import { AlertTriangle, Bot, Send, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api-client";
import { useAskAiChat } from "@/hooks/use-ai";
import type { ChatMessage } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AiChatPanelProps {
  week: string | undefined;
}

const SUGGESTED_QUESTIONS = [
  "What did the team work on this week?",
  "Who has the most blockers right now?",
  "Is anyone at risk of missing this week's report?",
];

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

export function AiChatPanel({ week }: AiChatPanelProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const mutation = useAskAiChat();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const isUnconfigured =
    mutation.isError && mutation.error instanceof ApiError && mutation.error.status === 503;

  function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || mutation.isPending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    mutation.mutate(
      { question: trimmed, week },
      {
        onSuccess: (result) => {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: result.answer },
          ]);
        },
      },
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-4 text-primary" />
          Ask about your team
        </CardTitle>
        <CardDescription>
          Answers are grounded only in this week&apos;s report data — nothing outside it is used.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 360 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">Try asking:</p>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="w-fit rounded-full border border-border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            messages.map((message) => <Bubble key={message.id} message={message} />)
          )}

          {mutation.isPending && (
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Bot className="size-3.5" />
              </div>
              <span className="animate-pulse">Thinking…</span>
            </div>
          )}

          {isUnconfigured && (
            <div className="flex items-start gap-2.5 rounded-md border border-dashed border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                The AI assistant isn&apos;t configured on this server yet. Set{" "}
                <code className="rounded bg-secondary px-1 py-0.5 text-xs">
                  OPENROUTER_API_KEY
                </code>{" "}
                in the backend environment to enable it.
              </span>
            </div>
          )}

          {mutation.isError && !isUnconfigured && (
            <p className="text-sm text-destructive">
              Couldn&apos;t get an answer right now. Try again in a moment.
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this week's reports…"
            disabled={mutation.isPending}
          />
          <Button type="submit" size="icon" disabled={mutation.isPending || !input.trim()}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
