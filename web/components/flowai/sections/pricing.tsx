import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PricingSection() {
  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight">What's Coming Next</h2>
        <p className="mt-2 text-muted-foreground">We're constantly innovating to bring you the most advanced calendar-based financial tools.</p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <RoadmapItem title="Multi-Chain Support" description="Expand beyond EVM to Ethereum, Polygon, and other major blockchains." status="Coming Soon" />
        <RoadmapItem title="Advanced DeFi Features" description="Staking, yield farming, and liquidity provision directly from calendar events." status="In Development" />
        <RoadmapItem title="Mobile App" description="Native mobile app for iOS and Android with push notifications for transaction status." status="Planned" />
        <RoadmapItem title="Enterprise Features" description="Advanced approval workflows, compliance tools, and enterprise-grade security." status="Planned" />
      </div>
    </section>
  )
}

function RoadmapItem({
  title,
  description,
  status,
}: {
  title: string
  description: string
  status: string
}) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <span className="px-3 py-1 bg-gray-100 text-black rounded-full text-sm font-medium">
            {status}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
