import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JA Chatbot',
  description: 'AI-powered chatbot with RAG capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}