"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface YesNoVoteProps {
  onVote: (voteYes: boolean) => void
  disabled?: boolean
  isLoading?: boolean
}

export function YesNoVote({ onVote, disabled, isLoading }: YesNoVoteProps) {
  const [selected, setSelected] = useState<boolean | null>(null)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Cast your vote for or against this proposal.</p>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "flex-1 h-20 flex-col gap-2 border-2",
            selected === true
              ? "border-[var(--yes-color)] bg-[var(--yes-color)]/10 text-[var(--yes-color)]"
              : "border-border hover:border-[var(--yes-color)]/50",
          )}
          onClick={() => setSelected(true)}
          disabled={disabled || isLoading}
        >
          <ThumbsUp className="h-6 w-6" />
          <span className="font-medium">Yes</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            "flex-1 h-20 flex-col gap-2 border-2",
            selected === false
              ? "border-[var(--no-color)] bg-[var(--no-color)]/10 text-[var(--no-color)]"
              : "border-border hover:border-[var(--no-color)]/50",
          )}
          onClick={() => setSelected(false)}
          disabled={disabled || isLoading}
        >
          <ThumbsDown className="h-6 w-6" />
          <span className="font-medium">No</span>
        </Button>
      </div>
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={selected === null || disabled || isLoading}
        onClick={() => selected !== null && onVote(selected)}
      >
        {isLoading ? "Submitting..." : "Submit Vote"}
      </Button>
    </div>
  )
}
