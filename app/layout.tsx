import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Nav } from "@/components/Nav";
import { RegisterSW } from "@/components/RegisterSW";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Winter Arc",
  description: "Compagnon d'endurance personnel — saisie 30 s, règles déterministes, sans LLM.",
  applicationName: "Winter Arc",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Winter Arc",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--bg)] text-[var(--fg)]">
        <RegisterSW />
        {children}
        <Nav />
      </body>
    </html>
  );
}
