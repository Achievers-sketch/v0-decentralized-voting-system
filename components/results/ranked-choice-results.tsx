"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal } from "lucide-react"

interface RankedChoiceResultsProps {
  results: {
    options: Array<{
      index: number
      name: string
      firstChoiceVotes: number
      rankDistribution: number[]
    }>
    total: number
    winner: string
  }
}

export function RankedChoiceResults({ results }: RankedChoiceResultsProps) {
  const sortedOptions = [...results.options].sort((a, b) => b.firstChoiceVotes - a.firstChoiceVotes)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Ranked Choice Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">Leading Option</span>
          <p className="text-2xl font-bold text-chart-2">{results.winner}</p>
        </div>

        <div className="space-y-4">
          {sortedOptions.map((option, idx) => {
            const percentage = results.total > 0 ? (option.firstChoiceVotes / results.total) * 100 : 0

            return (
              <div key={option.index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {idx < 3 && (
                      <Medal
                        className={`h-4 w-4 ${
                          idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-amber-600"
                        }`}
                      />
                    )}
                    <span className="font-medium text-foreground">{option.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {option.firstChoiceVotes} first-choice ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-muted [&>div]:bg-chart-2" />
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">Total Ballots: {results.total}</p>
        </div>
      </CardContent>
    </Card>
  )
}
