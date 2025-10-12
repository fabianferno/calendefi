import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function Navigation() {
    return (
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
    )
}

