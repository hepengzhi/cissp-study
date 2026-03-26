import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { LanguageToggle } from "@/components/language-toggle"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getLocale } from 'next-intl/server'

export const metadata: Metadata = {
  title: "CISSP Study Platform",
  description: "Master all 8 CISSP domains with interactive study tools",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Theme
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-mode');
                  }

                  // Language
                  var lang = localStorage.getItem('cissp-locale') || 'en';
                  document.documentElement.lang = lang;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#0d1117] antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Navbar />
          <LanguageToggle />
          <main className="pt-14">
            {children}
          </main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
