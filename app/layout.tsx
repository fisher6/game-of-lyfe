import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Hebrew } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoHebrew = Noto_Sans_Hebrew({
  variable: "--font-noto-hebrew",
  subsets: ["hebrew"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Game of Lyfe",
  description:
    "A playful life sim: choices, stats, and cloud saves — built with Next.js.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoHebrew.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
