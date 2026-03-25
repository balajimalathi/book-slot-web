import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/theme-provider";

import { Gabarito, Geist, Geist_Mono, Onest } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Gabarito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skndan Cal | Modern Scheduling & Payments",
  description: "Monetize your time effortlessly with Skndan Cal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
