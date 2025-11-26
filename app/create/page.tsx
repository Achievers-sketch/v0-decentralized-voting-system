"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { VotingMode, VOTING_MODE_LABELS, votingSystemConfig } from "@/lib/contracts"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Plus, X } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateProposalPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [description, setDescription] = useState("")
  const [votingMode, setVotingMode] = useState<VotingMode>(VotingMode.YES_NO)
  const [options, setOptions] = useState<string[]>(["", ""])
  const [duration, setDuration] = useState(7) // days

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const addOption = () => setOptions([...options, ""])
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }
  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = () => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + duration * 24 * 60 * 60)
    const finalOptions = votingMode === VotingMode.YES_NO ? [] : options.filter((o) => o.trim())

    writeContract({
      ...votingSystemConfig,
      functionName: "createProposal",
      args: [description, finalOptions, deadline, votingMode],
    })
  }

  if (isSuccess) {
    router.push("/proposals")
  }

  const isValid =
    description.trim() && (votingMode === VotingMode.YES_NO || options.filter((o) => o.trim()).length >= 2)

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Proposal</h1>
          <p className="mt-1 text-muted-foreground">Submit a new governance proposal for voting</p>
        </div>

        {!isConnected ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Connect your wallet to create a proposal</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-card-foreground">Proposal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your proposal..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-24 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">Voting Mode</Label>
                <RadioGroup
                  value={votingMode.toString()}
                  onValueChange={(v) => setVotingMode(Number.parseInt(v) as VotingMode)}
                  className="grid grid-cols-2 gap-3"
                >
                  {Object.entries(VOTING_MODE_LABELS).map(([mode, label]) => (
                    <div
                      key={mode}
                      className="flex items-center space-x-2 rounded-lg border border-border bg-secondary p-3"
                    >
                      <RadioGroupItem value={mode} id={`mode-${mode}`} />
                      <Label htmlFor={`mode-${mode}`} className="cursor-pointer text-foreground">
                        {label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {votingMode !== VotingMode.YES_NO && (
                <div className="space-y-3">
                  <Label className="text-foreground">Options</Label>
                  <div className="space-y-2">
                    {options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                        />
                        {options.length > 2 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="border-border"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={addOption} className="border-border bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-foreground">
                  Voting Duration (days)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={30}
                  value={duration}
                  onChange={(e) => setDuration(Number.parseInt(e.target.value) || 7)}
                  className="w-32 bg-secondary border-border text-foreground"
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!isValid || isPending || isConfirming}
                onClick={handleSubmit}
              >
                {isPending ? "Confirm in Wallet..." : isConfirming ? "Creating..." : "Create Proposal"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
