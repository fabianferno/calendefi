import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, Shield } from 'lucide-react'

export function HeroSection() {
    return (
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
    )
}

