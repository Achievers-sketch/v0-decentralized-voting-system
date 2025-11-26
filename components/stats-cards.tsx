"use client"

import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Vote, Users, Coins } from "lucide-react"
import { formatEther } from "viem"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function StatsCards() {
  const { data } = useSWR("/api/stats", fetcher)

  const stats = data?.data || {
    totalProposals: 0,
    totalVotes: 0,
    totalVoters: 0,
    totalTokensStaked: "0",
  }

  const cards = [
    {
      label: "Proposals",
      value: stats.totalProposals.toLocaleString(),
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Votes Cast",
      value: stats.totalVotes.toLocaleString(),
      icon: Vote,
      color: "text-chart-2",
    },
    {
      label: "Unique Voters",
      value: stats.totalVoters.toLocaleString(),
      icon: Users,
      color: "text-chart-3",
    },
    {
      label: "Tokens Staked",
      value: Number.parseFloat(formatEther(BigInt(stats.totalTokensStaked || "0"))).toFixed(2) + " GOV",
      icon: Coins,
      color: "text-chart-4",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`mt-1 text-2xl font-semibold ${card.color}`}>{card.value}</p>
              </div>
              <card.icon className={`h-8 w-8 ${card.color} opacity-50`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
