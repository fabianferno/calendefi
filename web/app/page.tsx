import { Navbar } from "@/components/flowai/navbar"
import { Hero } from "@/components/flowai/hero"
import { DashboardPreview } from "@/components/flowai/dashboard-preview"
import FeaturesSection from "@/components/flowai/sections/features"
import HowItWorksSection from "@/components/flowai/sections/how-it-works"
import PricingSection from "@/components/flowai/sections/pricing"
import { WaitlistSection } from "@/components/flowai/sections/waitlist"

export default function Page() {
  return (
    <main className="min-h-dvh">
      <div className="relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-rose-50 via-rose-50/60 to-orange-50" />
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <Navbar />
          <Hero />
          <DashboardPreview />
        </div>
      </div>

      {/* sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <WaitlistSection />
    </main>
  )
}
