import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SCB Deposit Filter - Bonus Harian',
  description: 'Filter data deposit untuk menampilkan user yang belum mendapatkan bonus deposit harian',
  authors: [{ name: 'SCB Team' }],
  keywords: 'deposit, bonus, filter, SCB',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-blue-600">SCB Deposit Filter</h1>
              </div>
              <div className="text-sm text-gray-500">
                v1.0.0
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
