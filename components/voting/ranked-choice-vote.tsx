"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankedChoiceVoteProps {
  options: string[]
  onVote: (rankings: number[]) => void
  disabled?: boolean
  isLoading?: boolean
}

export function RankedChoiceVote({ options, onVote, disabled, isLoading }: RankedChoiceVoteProps) {
  const [rankings, setRankings] = useState<number[]>(options.map((_, i) => i))

  const moveUp = (index: number) => {
    if (index === 0) return
    const newRankings = [...rankings]
    ;[newRankings[index - 1], newRankings[index]] = [newRankings[index], newRankings[index - 1]]
    setRankings(newRankings)
  }

  const moveDown = (index: number) => {
    if (index === rankings.length - 1) return
    const newRankings = [...rankings]
    ;[newRankings[index], newRankings[index + 1]] = [newRankings[index + 1], newRankings[index]]
    setRankings(newRankings)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Rank your choices from most preferred (top) to least preferred (bottom).
      </p>
      <div className="space-y-2">
        {rankings.map((optionIndex, rank) => (
          <div
            key={optionIndex}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-secondary p-3",
              rank === 0 && "border-chart-2",
            )}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-chart-2/20 text-xs font-medium text-chart-2">
              {rank + 1}
            </div>
            <span className="flex-1 text-sm font-medium text-foreground">{options[optionIndex]}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveUp(rank)}
                disabled={rank === 0 || disabled || isLoading}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveDown(rank)}
                disabled={rank === rankings.length - 1 || disabled || isLoading}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={disabled || isLoading}
        onClick={() => onVote(rankings)}
      >
        {isLoading ? "Submitting..." : "Submit Rankings"}
      </Button>
    </div>
  )
}
