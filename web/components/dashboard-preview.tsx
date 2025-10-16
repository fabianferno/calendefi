import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

export function DashboardPreview() {
  return (
    <section className="-mt-10">
      <div className={cn("relative mx-auto max-w-5xl overflow-hidden rounded-3xl border bg-white shadow-md")}>
        {/* top bar */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-white text-[10px] font-semibold">
              {"✺"}
            </div>
            <span className="font-semibold">FlowAI</span>
          </div>
          <div className="hidden w-72 items-center rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground sm:flex">
            {"🔎"} <span className="ml-2">Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Add new project
            </Button>
            <div className="h-7 w-7 rounded-full bg-muted" />
          </div>
        </div>

        {/* content grid */}
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          <StatCard title="Ongoing Projects" value="05" tone="rose" />
          <StatCard title="Pending Projects" value="02" tone="amber" />
          <StatCard title="Total Projects" value="11" tone="slate" />
          <StatCard title="Completed Projects" value="06" tone="sky" />
          <StatCard title="Payments Completed" value="04" tone="emerald" />
          <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
            Ongoing Projects List
            <div className="mt-3 h-24 rounded-lg border bg-white" />
          </div>
        </div>
      </div>
    </section>
  )
}

function StatCard({
  title,
  value,
  tone = "slate",
}: {
  title: string
  value: string
  tone?: "rose" | "amber" | "slate" | "sky" | "emerald"
}) {
  const badgeBg =
    tone === "rose"
      ? "bg-rose-100 text-rose-600"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700"
        : tone === "sky"
          ? "bg-sky-100 text-sky-700"
          : tone === "emerald"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-700"

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-2 inline-flex items-center gap-2">
        <span className={cn("h-6 w-6 rounded-md", badgeBg)} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}
