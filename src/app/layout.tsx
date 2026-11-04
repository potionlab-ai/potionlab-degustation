import type { Metadata, Viewport } from "next";
import "@fontsource-variable/outfit";
import "@fontsource/caveat/600.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dégustation · PotionLab",
  description: "Donnez votre avis sur votre boîte test PotionLab.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F7F5F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="studio min-h-full">{children}</body>
    </html>
  );
}
