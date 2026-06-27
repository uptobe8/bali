import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap" });
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Nusa Travel OS · Itinerario Indonesia en vivo",
  description: "Planificador visual de viaje a Indonesia: Bali, Gili Meno y Padang Padang.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="nusa-base-path" content={basePath} />
        {isStatic ? <link rel="stylesheet" href={`${basePath}/mobile-fix.css`} /> : null}
        {isStatic ? <script src={`${basePath}/static-api.js`} /> : null}
        {isStatic ? <script src={`${basePath}/image-fallbacks.js`} /> : null}
        {isStatic ? <script src={`${basePath}/final-mobile-gallery-fix.js`} /> : null}
      </head>
      <body className={`${manrope.variable} ${playfair.variable} font-sans antialiased bg-nusa-ink text-nusa-mist`}>
        {children}
      </body>
    </html>
  );
}
