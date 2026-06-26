import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nusa Travel OS · Itinerario Indonesia en vivo",
  description:
    "Planificador visual de viaje a Indonesia: Bali, Gili Meno y Padang Padang. Itinerario día a día con hoteles, restaurantes, playas, transportes, precios, mapa realista y buzón de sugerencias para Iria e Izan.",
  keywords: [
    "Indonesia",
    "Bali",
    "Gili Meno",
    "Padang Padang",
    "itinerario",
    "viaje",
    "Nusa Travel",
  ],
  authors: [{ name: "Nusa Travel OS" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Nusa Travel OS · Itinerario Indonesia",
    description:
      "Planifica tu viaje a Bali, Gili Meno y Padang Padang con itinerario editorial, mapa realista y buzón de sugerencias.",
    siteName: "Nusa Travel OS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${playfair.variable} font-sans antialiased bg-nusa-ink text-nusa-mist`}
      >
        {children}
      </body>
    </html>
  );
}
