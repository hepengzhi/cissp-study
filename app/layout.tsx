import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "CISSP Study Platform",
  description: "Comprehensive study platform for CISSP certification",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
