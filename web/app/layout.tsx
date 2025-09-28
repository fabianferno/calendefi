import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'CalendeFi - Every Calendar Event is a Transaction',
    description: 'With CalendeFi, every calendar event is a transaction — stake, swap, or pay — scheduled in time. Convert your Google Calendar into an autonomous blockchain wallet.',
    keywords: 'calendar, blockchain, wallet, crypto, transactions, scheduling',
    authors: [{ name: 'CalendeFi Team' }],
    openGraph: {
        title: 'CalendeFi - Every Calendar Event is a Transaction',
        description: 'Convert your Google Calendar into an autonomous blockchain wallet on EVM.',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
                <Toaster />
            </body>
        </html>
    )
}
