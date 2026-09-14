"use client";

import * as React from "react";
import { Bot, Send } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiChat } from "@/hooks/use-ai";
import { ApiError } from "@/lib/api-client";

interface ChatTurn {
  question: string;
  answer: string;
}

interface AiChatWidgetProps {
  week: string | undefined;
}

// Each question is sent statelessly — the backend rebuilds the team-week
// context per call and doesn't retain conversation history, so `turns` here
// is purely a local display log, not something replayed to the model.
export function AiChatWidget({ week }: AiChatWidgetProps) {
  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [turns, setTurns] = React.useState<ChatTurn[]>([]);
  const chatMutation = useAiChat();

  function handleAsk() {
    const trimmed = question.trim();
    if (!trimmed || chatMutation.isPending) return;

    chatMutation.mutate(
      { week, question: trimmed },
      {
        onSuccess: (result) => {
          setTurns((prev) => [...prev, { question: trimmed, answer: result.answer }]);
          setQuestion("");
        },
      },
    );
  }

  const errorMessage =
    chatMutation.error instanceof ApiError && chatMutation.error.status === 503
      ? "AI features aren't configured on this server yet."
      : chatMutation.isError
        ? "Something went wrong answering that."
        : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="size-4" />
          Ask about this week
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask about this week</SheetTitle>
          <SheetDescription>
            Answers are based only on this week&apos;s submitted reports.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {turns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Try &quot;Who has the most blockers?&quot; or &quot;What&apos;s the team focused
              on?&quot;
            </p>
          ) : (
            turns.map((turn, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium text-foreground">{turn.question}</p>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{turn.answer}</p>
              </div>
            ))
          )}
          {chatMutation.isPending ? (
            <p className="text-sm text-muted-foreground">Thinking…</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </div>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about this week..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleAsk}
              disabled={chatMutation.isPending || !question.trim()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
