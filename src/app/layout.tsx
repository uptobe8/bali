import type { Metadata } from 'next'
import { Archivo_Black, Inter, Permanent_Marker } from 'next/font/google'
import './globals.css'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
const archivo = Archivo_Black({ variable: '--font-archivo', weight: '400', subsets: ['latin'], display: 'swap' })
const marker = Permanent_Marker({ variable: '--font-marker', weight: '400', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Tu Ruta Cádiz en Camper',
  description: 'Planificador visual de rutas camper por Cádiz: playas, pueblos, surf, miradores y zonas frente al mar.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className={`${inter.variable} ${archivo.variable} ${marker.variable}`}>{children}</body>
    </html>
  )
}
