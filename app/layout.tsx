import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Options Viewer - Montreal Exchange',
  description: 'Visualisation des options du Montreal Exchange',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50">{children}</body>
    </html>
  )
}
