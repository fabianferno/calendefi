"use client"

import { useState } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function Hero() {
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
    <section
      className={cn("relative mt-6 overflow-hidden rounded-3xl border shadow-sm", "px-6 py-14 sm:py-16 md:py-20")}
    >
      {/* Background gradient and subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(1200px 500px at 50% -10%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%),
            linear-gradient(180deg, #ffe3ea 0%, #ffd9c8 45%, #fed4d6 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px, 40px 40px",
          maskImage: "radial-gradient(100% 70% at 50% 30%, rgba(0,0,0,1), rgba(0,0,0,0.05))",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="rounded-full border bg-white/70 px-2.5 py-1 text-xs font-medium shadow-sm">New</span>
          <span className="rounded-full border bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
            Calendar-Based Finance
          </span>
        </div>

        <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Your Calendar is Now a <span className='font-black'>Wallet</span>
        </h1>

        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          With CalendeFi, every calendar event is a transaction — stake, swap, or pay — scheduled in time. Convert your Google Calendar into an autonomous blockchain wallet on EVM.
        </p>

        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Get early access to production features and be among the first to experience calendar-based finance.
          </p>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email for early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12 bg-white text-base"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="lg"
                className={cn(
                  "h-12 px-6 bg-neutral-900 hover:bg-neutral-800 text-white",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,.15)]"
                )}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Get Early Access"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 max-w-md mx-auto">
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
      </div>
    </section>
  )
}

export default Hero
