import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function FeaturesSection() {
  const features = [
    { title: "Calendar-Based Transactions", desc: "Send crypto by creating calendar events with specific titles. Every event becomes a transaction." },
    { title: "Scheduled Execution", desc: "Transactions execute automatically at the event's scheduled time. No manual intervention needed." },
    { title: "RSVP-Based Approval", desc: "Invite people to transaction events for group approval. Majority rule ensures security." },
    { title: "Token Swaps", desc: "Swap tokens directly from your calendar. Support for ETH, USDC, USDT, YLDY, and OPUL." },
    { title: "Group Wallets", desc: "Each calendar gets its own unique wallet. Perfect for shared calendars and team operations." },
    { title: "WalletConnect Integration", desc: "Connect to dApps through all-day calendar events. Seamless DeFi integration." },
  ]
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Powerful Features for Modern Finance</h2>
        <p className="mt-2 text-muted-foreground">
          Transform your calendar into a powerful financial tool with our innovative blockchain integration.
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} className="rounded-2xl">
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
