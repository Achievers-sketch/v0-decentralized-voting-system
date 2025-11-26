"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Coins } from "lucide-react"

interface WeightedVoteProps {
  options: string[]
  onVote: (optionIndex: number) => void
  disabled?: boolean
  isLoading?: boolean
  tokenBalance?: string
}

export function WeightedVote({ options, onVote, disabled, isLoading, tokenBalance = "0" }: WeightedVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string>("")
  const balance = Number.parseFloat(tokenBalance)
  const hasTokens = balance > 0

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Your vote weight is determined by your governance token balance. Select your preferred option.
        </p>

        <div className="flex items-center gap-3 rounded-lg border border-chart-4 bg-chart-4/10 p-4">
          <Coins className="h-6 w-6 text-chart-4" />
          <div>
            <p className="text-sm text-muted-foreground">Your Voting Weight</p>
            <p className="text-xl font-bold text-chart-4">{balance.toFixed(2)} GOV</p>
          </div>
        </div>

        <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 rounded-lg border border-border bg-secondary p-3">
              <RadioGroupItem
                value={index.toString()}
                id={`weighted-option-${index}`}
                disabled={disabled || isLoading || !hasTokens}
              />
              <Label htmlFor={`weighted-option-${index}`} className="flex-1 cursor-pointer text-foreground">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={!selectedOption || !hasTokens || disabled || isLoading}
        onClick={() => onVote(Number.parseInt(selectedOption))}
      >
        {isLoading ? "Submitting..." : !hasTokens ? "No Voting Weight" : `Cast Vote with ${balance.toFixed(2)} Weight`}
      </Button>
    </div>
  )
}
