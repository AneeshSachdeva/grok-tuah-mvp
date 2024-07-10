import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { GrokSidebar } from '@/components/GrokSidebar'
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grok Tuah Learning System',
  description: 'An AI-powered adaptive learning system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <GrokSidebar />
          <main className="transition-all duration-300 ease-in-out ml-64 p-4">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}