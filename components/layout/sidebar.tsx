"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, FileText, PlusCircle, BarChart3, ScrollText, User, Vote } from "lucide-react"

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Proposals", href: "/proposals", icon: FileText },
  { name: "Create", href: "/create", icon: PlusCircle },
  { name: "Results", href: "/results", icon: BarChart3 },
  { name: "Audit Log", href: "/audit", icon: ScrollText },
  { name: "My Votes", href: "/voter", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Vote className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">VoteDAO</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Base Sepolia</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
