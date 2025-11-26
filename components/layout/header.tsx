"use client"

import { ConnectKitButton } from "connectkit"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Search proposals..." className="w-64 pl-9 bg-secondary border-border" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ConnectKitButton />
      </div>
    </header>
  )
}
