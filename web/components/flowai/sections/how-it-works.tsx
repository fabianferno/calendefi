import { Badge } from "@/components/ui/badge"

export default function HowItWorksSection() {
  const steps = [
    { n: 1, title: "Copy Service Account Email", desc: "Copy the CalendeFi agent's service account email. This is your unique agent identifier." },
    { n: 2, title: "Onboard Your Calendar", desc: "After inviting the service account to your calendar, enter your calendar ID to onboard it with CalendeFi." },
    { n: 3, title: "Start Creating Transactions", desc: "Create calendar events with transaction titles. The agent will automatically process them." },
  ]
  return (
    <section id="onboarding" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Get Started in 3 Simple Steps</h2>
        <p className="mt-2 text-muted-foreground">Set up your CalendeFi wallet in minutes and start scheduling transactions.</p>
      </div>
      <ol className="mx-auto mt-8 grid max-w-3xl gap-4">
        {steps.map((s) => (
          <li key={s.n} className="flex items-start gap-3 rounded-2xl border p-4">
            <Badge className="rounded-full">{s.n}</Badge>
            <div>
              <div className="font-medium">{s.title}</div>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
