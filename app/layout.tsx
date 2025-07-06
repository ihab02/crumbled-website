import type React from "react"
import type { Metadata } from "next"
import { Quicksand } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Header from "@/components/header"
import { Footer } from "@/components/footer"

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const inter = Inter({ 
  subsets: ['latin'],
  display: "swap",
  preload: true,
  fallback: ['system-ui', 'arial'],
})

export const metadata: Metadata = {
  title: "Crumbled - Delicious Cookies Delivered",
  description: "Order fresh, homemade cookies delivered to your doorstep",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${quicksand.variable} font-sans ${inter.className}`} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          <SonnerToaster />
        </Providers>
      </body>
    </html>
  )
}
