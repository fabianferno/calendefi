"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function OnboardingSection() {
  const [copied, setCopied] = useState(false)
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

  return (
    <section id="onboarding" className="py-20">
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
  )
}
