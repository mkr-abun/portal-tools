import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PDF Tools - IRSE Portal',
  description: 'PDF generation and editing tools',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    PDF Tools
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-4-8 items-center">
                  <Link
                    href="/"
                    className="text-gray-900 hover:text-blue-600 px-3 rounded-md text-sm font-medium transition-colors"
                  >
                    Generator Demo
                  </Link>
                  <Link
                    href="/pdf-builder"
                    className="text-gray-900 hover:text-blue-600 px-3 rounded-md text-sm font-medium transition-colors"
                  >
                    HTML Builder
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-500">Portal Tools</span>
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
