"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  return (
    <header>
      <nav
        className={cn(
          "mx-auto mt-2 flex items-center justify-between",
          "rounded-full border bg-white/70 px-4 py-2 shadow-sm backdrop-blur-md",
          "dark:bg-black/30",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-rose-500 text-white text-xs font-semibold">
            {"✺"}
          </div>
          <span className="font-semibold">FlowAI</span>
        </div>

        <ul className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <li>
            <Link href="#features" className="hover:text-foreground transition-colors">
              Features
            </Link>
          </li>
          <li>
            <Link href="#how" className="hover:text-foreground transition-colors">
              How it Works
            </Link>
          </li>
          <li>
            <Link href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link href="#login" className="hidden text-sm text-muted-foreground hover:text-foreground md:inline">
            Login
          </Link>
          <Button
            size="sm"
            className={cn(
              "rounded-full px-4",
              "bg-neutral-900 hover:bg-neutral-800 text-white",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,.15)]",
            )}
          >
            <span className="mr-1">Try FlowAI for Free</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </header>
  )
}
