import type React from "react"
import type { Metadata } from "next"
import { Geist, Source_Serif_4 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Dendrit - Gestión de Inventario",
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
    // Removed dark class - light mode is now default
    <html className="bg-secondary" lang="en">
      <body className={`font-sans antialiased ${geistSans.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
