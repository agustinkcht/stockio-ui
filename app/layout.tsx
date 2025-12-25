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
    <html className="bg-[rgb(243,242,238)]" lang="en">
      <body className={`font-sans antialiased bg-[rgb(243,242,238)] ${geistSans.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
