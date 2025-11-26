"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, ThumbsDown, Trophy } from "lucide-react"

interface YesNoResultsProps {
  results: {
    yes: number
    no: number
    total: number
    winner: string
  }
}

export function YesNoResults({ results }: YesNoResultsProps) {
  const yesPercentage = results.total > 0 ? (results.yes / results.total) * 100 : 0
  const noPercentage = results.total > 0 ? (results.no / results.total) * 100 : 0

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Winner</span>
          <p className="text-3xl font-bold text-primary">{results.winner}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-[var(--yes-color)]" />
                <span className="font-medium text-foreground">Yes</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {results.yes} ({yesPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={yesPercentage} className="h-3 bg-muted [&>div]:bg-[var(--yes-color)]" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-[var(--no-color)]" />
                <span className="font-medium text-foreground">No</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {results.no} ({noPercentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={noPercentage} className="h-3 bg-muted [&>div]:bg-[var(--no-color)]" />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">Total Votes: {results.total}</p>
        </div>
      </CardContent>
    </Card>
  )
}
