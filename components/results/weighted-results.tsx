"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Scale } from "lucide-react"

interface WeightedResultsProps {
  results: {
    options: Array<{
      index: number
      name: string
      weight: number
      percentage: number
    }>
    totalWeight: number
    totalVoters: number
    winner: string
  }
}

export function WeightedResults({ results }: WeightedResultsProps) {
  const sortedOptions = [...results.options].sort((a, b) => b.weight - a.weight)

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          Weighted Voting Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center rounded-lg bg-secondary p-4">
            <span className="text-sm text-muted-foreground">Winner</span>
            <p className="text-xl font-bold text-chart-4">{results.winner}</p>
          </div>
          <div className="text-center rounded-lg bg-secondary p-4">
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Scale className="h-4 w-4" />
              <span>Total Weight</span>
            </div>
            <p className="text-xl font-bold text-chart-4">{results.totalWeight.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-4">
          {sortedOptions.map((option) => (
            <div key={option.index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{option.name}</span>
                <span className="text-sm text-muted-foreground">
                  {option.weight.toLocaleString()} ({option.percentage.toFixed(1)}%)
                </span>
              </div>
              <Progress value={option.percentage} className="h-2 bg-muted [&>div]:bg-chart-4" />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">Total Voters: {results.totalVoters}</p>
        </div>
      </CardContent>
    </Card>
  )
}
