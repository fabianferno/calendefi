"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Plus,
  Check,
  DollarSign,
  ScanSearch,
  Timer,
  Hourglass,
  FolderKanban,
  CheckCircle2,
  CircleDollarSign,
  type LucideIcon,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast" // Import useToast

type ProjectStatus = "ongoing" | "pending" | "completed"
type Project = {
  id: number
  name: string
  status: ProjectStatus
  paid: boolean
}

const initialProjects: Project[] = [
  { id: 1, name: "Website Redesign", status: "ongoing", paid: false },
  { id: 2, name: "Mobile App MVP", status: "pending", paid: false },
  { id: 3, name: "Client Onboarding", status: "completed", paid: true },
]

export function DashboardPreview() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const { toast } = useToast() // Declare useToast

  const filtered = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  )

  const stats = useMemo(() => {
    const total = projects.length
    const ongoing = projects.filter((p) => p.status === "ongoing").length
    const pending = projects.filter((p) => p.status === "pending").length
    const completed = projects.filter((p) => p.status === "completed").length
    const paid = projects.filter((p) => p.paid).length
    return { total, ongoing, pending, completed, paid }
  }, [projects])

  function addProject() {
    if (!newName.trim()) return
    setProjects((prev) => [{ id: Date.now(), name: newName.trim(), status: "ongoing", paid: false }, ...prev])
    setNewName("")
    setOpen(false)
    toast({ title: "Project added", description: "Your new project was created." })
  }

  function toggleStatus(id: number) {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const order: ProjectStatus[] = ["pending", "ongoing", "completed"]
        const idx = order.indexOf(p.status)
        const next = order[(idx + 1) % order.length]
        return { ...p, status: next }
      }),
    )
  }

  function togglePaid(id: number) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, paid: !p.paid } : p)))
  }

  return (
    <section className="-mt-10 max-w-5xl mx-auto">
      <div className="relative">
        <div className="bg-yellow-100 rounded-2xl shadow-2xl p-6 border border-gray-200">


          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-day  text-gray-500 font-medium text-xs">
                {day}
              </div>
            ))}

            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 6 + 1
              const isCurrentMonth = day > 0 && day <= 31
              const hasEvent = [9, 15, 20, 25, 28].includes(day)

              return (
                <div
                  key={i}
                  className={`calendar-day border border-black/10 flex-col gap-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
                    } ${day === 15 ? 'bg-gray-100 text-black font-semibold' : ''}`}
                >
                  {isCurrentMonth ? day : ''}
                  {hasEvent && (
                    <div className="calendar-event text-xs">
                      {day === 9 && 'Send 5 ETH'}
                      {day === 15 && 'Swap 10 USDC'}
                      {day === 20 && 'Connect Dapp'}
                      {day === 25 && 'Team Payment'}
                      {day === 28 && 'Send 10 PYUSD'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute -top-5 -right-4 bg-black text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Transaction Executed ✓
        </div>
        <div className="absolute -bottom-1 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
          Wallet Connected
        </div>
      </div>
    </section>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string
  value: string
  icon: LucideIcon
  iconClass?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 inline-flex items-center gap-2">
        <div className={cn("grid h-6 w-6 place-items-center rounded-md", iconClass || "bg-rose-100 text-rose-600")}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
