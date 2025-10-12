import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function RoadmapSection() {
    const futureProjects = [
        {
            title: "Multi-Chain Support",
            description: "Expand beyond EVM to Ethereum, Polygon, and other major blockchains.",
            status: "Coming Soon"
        },
        {
            title: "Advanced DeFi Features",
            description: "Staking, yield farming, and liquidity provision directly from calendar events.",
            status: "In Development"
        },
        {
            title: "Mobile App",
            description: "Native mobile app for iOS and Android with push notifications for transaction status.",
            status: "Planned"
        },
        {
            title: "Enterprise Features",
            description: "Advanced approval workflows, compliance tools, and enterprise-grade security.",
            status: "Planned"
        }
    ]

    return (
        <section id="roadmap" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        What's Coming Next
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        We're constantly innovating to bring you the most advanced calendar-based financial tools.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {futureProjects.map((project, index) => (
                        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{project.title}</CardTitle>
                                    <span className="px-3 py-1 bg-gray-100 text-black rounded-full text-sm font-medium">
                                        {project.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-gray-600 leading-relaxed">
                                    {project.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

