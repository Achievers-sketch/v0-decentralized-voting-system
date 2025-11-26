"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Coins } from "lucide-react"
import { formatEther } from "viem"

interface QuadraticResultsProps {
  results: {
    options: Array<{
      index: number
      name: string
      votes: number
    }>
    tokensStaked: string
    total: number
    winner: string
  }
}

export function QuadraticResults({ results }: QuadraticResultsProps) {
  const totalVotes = results.options.reduce((sum, o) => sum + o.votes, 0)
  const sortedOptions = [...results.options].sort((a, b) => b.votes - a.votes)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Quadratic Voting Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center rounded-lg bg-secondary p-4">
            <span className="text-sm text-muted-foreground">Winner</span>
            <p className="text-xl font-bold text-chart-3">{results.winner}</p>
          </div>
          <div className="text-center rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Coins className="h-4 w-4" />
              <span>Tokens Staked</span>
            </div>
            <p className="text-xl font-bold text-chart-3">
              {Number.parseFloat(formatEther(BigInt(results.tokensStaked || "0"))).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedOptions.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0

            return (
              <div key={option.index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{option.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.votes} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2 bg-muted [&>div]:bg-chart-3" />
              </div>
            )
          })}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">Total Voters: {results.total}</p>
        </div>
      </CardContent>
    </Card>
  )
}
