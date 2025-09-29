"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Shield, Zap, Users, Wallet, ArrowRight, Copy, Check, Star, ChevronRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'

export default function Home() {
    const [copied, setCopied] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [calendarId, setCalendarId] = useState('')
    const [isOnboarding, setIsOnboarding] = useState(false)
    const [onboardedCalendars, setOnboardedCalendars] = useState<string[]>([])
    const { toast } = useToast()

    const serviceAccountEmail = "agents@calendefi.iam.gserviceaccount.com"

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(serviceAccountEmail)
            setCopied(true)
            toast({
                title: "Copied!",
                description: "Service account email copied to clipboard",
            })
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy: ', err)
            toast({
                title: "Error",
                description: "Failed to copy to clipboard",
                variant: "destructive",
            })
        }
    }

    const onboardCalendar = async () => {
        if (!calendarId.trim()) {
            toast({
                title: "Error",
                description: "Please enter a calendar ID",
                variant: "destructive",
            })
            return
        }

        setIsOnboarding(true)
        try {
            const response = await fetch(`/api/onboard/${encodeURIComponent(calendarId.trim())}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                setOnboardedCalendars(prev => [...prev, calendarId.trim()])
                setCalendarId('')
                toast({
                    title: "Success!",
                    description: "Calendar onboarded successfully",
                })
            } else {
                const errorData = await response.json()
                toast({
                    title: "Error",
                    description: errorData.message || "Failed to onboard calendar",
                    variant: "destructive",
                })
            }
        } catch (err) {
            console.error('Failed to onboard calendar: ', err)
            toast({
                title: "Error",
                description: "Failed to onboard calendar. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsOnboarding(false)
        }
    }

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

    const calendarEvents = [
        { time: "9:00 AM", title: "Send 5 ETH to CRIBUTZOZLY2PBQHYJYPPFIFE2QDMDHZG4CTMB3DFNIDU4DA34WIZ6DLVY", type: "transaction" },
        { time: "2:00 PM", title: "Swap 10 USDC to ETH", type: "swap" },
        { time: "4:00 PM", title: "Connect to Dapp", type: "walletconnect" },
        { time: "6:00 PM", title: "Send 2 ETH to Team Wallet", type: "transaction", attendees: 3 }
    ]

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="border-b bg-yellow-300/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <Image
                                src="/logo.png"
                                alt="CalendeFi Logo"
                                width={32}
                                height={32}
                                className="w-8 h-8"
                            />
                            <span className="text-xl font-bold text-black">
                                calendefi
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                            <a href="#onboarding" className="text-gray-600 hover:text-gray-900 transition-colors">Get Started</a>
                            <a href="#roadmap" className="text-gray-600 hover:text-gray-900 transition-colors">Roadmap</a>
                            <Button className="bg-black hover:bg-gray-800 text-white">
                                Try Now
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 sm:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                    Your Calendar is Now a <span className='font-black'>Wallet</span>
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    With CalendeFi, every calendar event is a transaction — stake, swap, or pay — scheduled in time.
                                    Convert your Google Calendar into an autonomous blockchain wallet on EVM.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="bg-black hover:bg-gray-800 text-white text-lg px-8 py-4">
                                    Get Started Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-black text-black hover:bg-black hover:text-white">
                                    Watch Demo
                                </Button>
                            </div>

                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center space-x-2">
                                    <Star className="h-4 w-4 text-black" />
                                    <span>4.9/5 Rating</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4 text-black" />
                                    <span>1,000+ Users</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Shield className="h-4 w-4 text-black" />
                                    <span>Secure & Reliable</span>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Mockup */}
                        <div className="relative">
                            <div className="bg-yellow-100 rounded-2xl shadow-2xl p-6 border border-gray-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-gray-900">December 2024</h3>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline">‹</Button>
                                        <Button size="sm" variant="outline">›</Button>
                                    </div>
                                </div>

                                <div className="calendar-grid">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="calendar-day text-gray-500 font-medium text-xs">
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
                                                className={`calendar-day flex-col gap-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-300'
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
                            <div className="absolute -bottom-1 bg-gray-800 text-xs text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                                Wallet Connected
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
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

            {/* Onboarding Section */}
            <section id="onboarding" className="py-20 bg-yellow-100">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Get Started in 3 Simple Steps
                        </h2>
                        <p className="text-xl text-gray-600">
                            Set up your CalendeFi wallet in minutes and start scheduling transactions.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    1
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Copy Service Account Email</h3>
                                    <p className="text-gray-600 mb-4">
                                        Copy the CalendeFi agent's service account email below. This is your unique agent identifier.
                                    </p>
                                    <div className="flex space-x-2">
                                        <Input
                                            value={serviceAccountEmail}
                                            readOnly
                                            className="font-mono text-sm"
                                        />
                                        <Button onClick={copyToClipboard} variant="outline" className="px-4">
                                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    {copied && (
                                        <p className="text-green-600 text-sm mt-2">✓ Copied to clipboard!</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    2
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Onboard Your Calendar</h3>
                                    <p className="text-gray-600 mb-4">
                                        After inviting the service account to your calendar, enter your calendar ID below to onboard it with CalendeFi.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-gray-700 font-mono">
                                                1. Open Google Calendar<br />
                                                2. Click "+" → "Create new calendar"<br />
                                                3. Add the service account email as a collaborator<br />
                                                4. Grant "Make changes to events" permission<br />
                                                5. Copy your calendar ID from the calendar settings
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Input
                                                value={calendarId}
                                                onChange={(e) => setCalendarId(e.target.value)}
                                                placeholder="Enter your calendar ID (e.g., abc123@group.calendar.google.com)"
                                                className="font-mono text-sm"
                                                disabled={isOnboarding}
                                            />
                                            <Button
                                                onClick={onboardCalendar}
                                                disabled={isOnboarding || !calendarId.trim()}
                                                className="px-6"
                                            >
                                                {isOnboarding ? "Onboarding..." : "Onboard"}
                                            </Button>
                                        </div>
                                        {onboardedCalendars.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm text-green-600 font-medium mb-2">✓ Onboarded Calendars:</p>
                                                <div className="space-y-1">
                                                    {onboardedCalendars.map((id, index) => (
                                                        <div key={index} className="text-sm text-gray-600 font-mono bg-green-50 p-2 rounded">
                                                            {id}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    3
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Creating Transactions</h3>
                                    <p className="text-gray-600 mb-4">
                                        Create calendar events with transaction titles. The agent will automatically process them.
                                    </p>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 font-mono">
                                            Event Title: "Send 5 PYUSD to fabianferno.eth"<br />
                                            Time: When you want the transaction to execute<br />
                                            Attendees: Optional - for group approval
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <div className="text-center">
                                <Button size="lg" className="bg-black hover:bg-gray-800 text-white">
                                    Start Using CalendeFi
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                                <p className="text-sm text-gray-500 mt-4">
                                    Need help? Check our documentation or contact support.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Projects Section */}
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


            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-3 mb-4">
                                <Image
                                    src="/logo.png"
                                    alt="CalendeFi Logo"
                                    width={32}
                                    height={32}
                                    className="w-8 h-8"
                                />
                                <span className="text-xl font-bold">CalendeFi</span>
                            </div>
                            <p className="text-gray-400">
                                Every calendar event is a transaction — stake, swap, or pay — scheduled in time.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 CalendeFi. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
