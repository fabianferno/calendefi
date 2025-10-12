import { Navigation } from '@/components/navigation'
import { HeroSection } from '@/components/hero-section'
import { FeaturesSection } from '@/components/features-section'
import { OnboardingSection } from '@/components/onboarding-section'
import { RoadmapSection } from '@/components/roadmap-section'
import { WaitlistSection } from '@/components/waitlist-section'
import { Footer } from '@/components/footer'

export default function Home() {

    return (
        <div className="min-h-screen">
            <Navigation />
            <HeroSection />
            <FeaturesSection />
            <OnboardingSection />
            <RoadmapSection />
            <WaitlistSection />
            <Footer />
        </div>
    )
}
