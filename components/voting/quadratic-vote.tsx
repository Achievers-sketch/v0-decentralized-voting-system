"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface QuadraticVoteProps {
  options: string[]
  onVote: (optionIndex: number, voteAmount: number) => void
  disabled?: boolean
  isLoading?: boolean
  tokenBalance?: string
}

export function QuadraticVote({ options, onVote, disabled, isLoading, tokenBalance = "0" }: QuadraticVoteProps) {
  const [selectedOption, setSelectedOption] = useState<string>("")
  const [voteAmount, setVoteAmount] = useState(1)

  const cost = voteAmount * voteAmount
  const balance = Number.parseFloat(tokenBalance)
  const canAfford = cost <= balance

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select an option and choose how many votes to cast. Cost increases quadratically: votes² = tokens required.
        </p>

        <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center space-x-3 rounded-lg border border-border bg-secondary p-3">
              <RadioGroupItem value={index.toString()} id={`option-${index}`} disabled={disabled || isLoading} />
              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-foreground">
                {option}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-secondary p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Vote Power</span>
          <span className="text-2xl font-bold text-chart-3">{voteAmount}</span>
        </div>
        <Slider
          value={[voteAmount]}
          onValueChange={([value]) => setVoteAmount(value)}
          min={1}
          max={10}
          step={1}
          disabled={disabled || isLoading}
          className="[&>span:first-child]:bg-muted [&>span:first-child>span]:bg-chart-3 [&>span:last-child]:bg-chart-3"
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Token Cost:</span>
          <span className={canAfford ? "text-foreground" : "text-destructive"}>{cost} GOV</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your Balance:</span>
          <span className="text-foreground">{balance.toFixed(2)} GOV</span>
        </div>
      </div>

      <Button
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={!selectedOption || !canAfford || disabled || isLoading}
        onClick={() => onVote(Number.parseInt(selectedOption), voteAmount)}
      >
        {isLoading
          ? "Submitting..."
          : !canAfford
            ? "Insufficient Balance"
            : `Cast ${voteAmount} Vote${voteAmount > 1 ? "s" : ""} for ${cost} GOV`}
      </Button>
    </div>
  )
}
