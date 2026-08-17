import type React from "react"
import type { Metadata } from "next"
import { Geist, Source_Serif_4 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AccountProvider } from "@/lib/contexts/account-context"
import { SettingsProvider } from "@/lib/contexts/settings-context"
import { PeriodProvider } from "@/lib/contexts/period-context"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Stockio - Suite de Negocio",
  description: "Sistema de gestión de inventario",
  generator: "v0.app",
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="bg-panel-content" lang="en">
      <body className={`font-sans antialiased bg-panel-content ${geistSans.className}`}>
        <SettingsProvider>
          <PeriodProvider>
            <AccountProvider>
              <div className="min-h-screen bg-panel-content">{children}</div>
            </AccountProvider>
          </PeriodProvider>
        </SettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
