"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'

export function WaitlistSection() {
    const [email, setEmail] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive",
            })
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await response.json()

            if (response.ok) {
                setIsSuccess(true)
                setEmail('')
                toast({
                    title: "Success!",
                    description: data.message || "You've been added to the waitlist",
                })
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to join waitlist. Please try again.",
                    variant: "destructive",
                })
            }
        } catch (error) {
            console.error('Error submitting to waitlist:', error)
            toast({
                title: "Error",
                description: "Something went wrong. Please try again later.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="py-20 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="bg-white border-0 shadow-2xl overflow-hidden">
                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Left side - Content */}
                            <div className="p-8 md:p-12 flex flex-col justify-center">
                                <div className="inline-flex items-center space-x-2 bg-yellow-100 rounded-full px-4 py-2 w-fit mb-6">
                                    <Mail className="h-4 w-4 text-gray-900" />
                                    <span className="text-sm font-semibold text-gray-900">Early Access</span>
                                </div>

                                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                                    Join the Waitlist
                                </h2>

                                <p className="text-lg text-gray-600 mb-6">
                                    Be among the first to experience the future of calendar-based finance. Get early access to CalendeFi and exclusive benefits.
                                </p>

                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-start space-x-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Priority access to new features</span>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Exclusive community perks</span>
                                    </li>
                                    <li className="flex items-start space-x-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700">Direct support from our team</span>
                                    </li>
                                </ul>

                                {!isSuccess ? (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex-1 h-12 text-base"
                                                disabled={isSubmitting}
                                            />
                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="bg-black hover:bg-gray-800 text-white h-12 px-8"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? "Joining..." : "Join Now"}
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            We respect your privacy. Unsubscribe at any time.
                                        </p>
                                    </form>
                                ) : (
                                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                                        <div className="flex items-center space-x-3">
                                            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                            <div>
                                                <h3 className="font-semibold text-green-900">You're on the list!</h3>
                                                <p className="text-sm text-green-700">We'll notify you when CalendeFi launches.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right side - Visual */}
                            <div className="bg-gradient-to-br from-yellow-300 to-yellow-400 p-8 md:p-12 flex items-center justify-center relative overflow-hidden">
                                <div className="relative z-10 text-center">
                                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                                        <Mail className="h-12 w-12 text-gray-900" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                        Get Early Access
                                    </h3>
                                    <p className="text-gray-800">
                                        Join 1,000+ users already on the waitlist
                                    </p>
                                </div>

                                {/* Decorative circles */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}

