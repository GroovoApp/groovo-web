import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { FallingEmojisProvider } from '@/src/app/contexts/FallingEmojisContext';

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = localFont({
  src: "./display.ttf",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Groovo | The friendly music app",
  description: "Groovo | The friendly music app. Build playlists with friends and share your favorite tunes.",
  icons: {
    icon: "/Groovo-ico.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${geistMono.variable} ${display.variable} antialiased`}
      >
        <FallingEmojisProvider>
          {children}
          <Toaster richColors/>
        </FallingEmojisProvider>
      </body>
    </html>
  );
}
