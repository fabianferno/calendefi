import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, Shield, Zap, Users, Wallet } from 'lucide-react'

export function FeaturesSection() {
    const features = [
        {
            icon: <Calendar className="h-6 w-6" />,
            title: "Calendar-Based Transactions",
            description: "Send crypto by creating calendar events with specific titles. Every event becomes a transaction."
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "Scheduled Execution",
            description: "Transactions execute automatically at the event's scheduled time. No manual intervention needed."
        },
        {
            icon: <Shield className="h-6 w-6" />,
            title: "RSVP-Based Approval",
            description: "Invite people to transaction events for group approval. Majority rule ensures security."
        },
        {
            icon: <Zap className="h-6 w-6" />,
            title: "Token Swaps",
            description: "Swap tokens directly from your calendar. Support for ETH, USDC, USDT, YLDY, and OPUL."
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: "Group Wallets",
            description: "Each calendar gets its own unique wallet. Perfect for shared calendars and team operations."
        },
        {
            icon: <Wallet className="h-6 w-6" />,
            title: "WalletConnect Integration",
            description: "Connect to dApps through all-day calendar events. Seamless DeFi integration."
        }
    ]

    return (
        <section id="features" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Powerful Features for Modern Finance
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Transform your calendar into a powerful financial tool with our innovative blockchain integration.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="bg-yellow-100 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <CardHeader>
                                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-4">
                                    {feature.icon}
                                </div>
                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}

