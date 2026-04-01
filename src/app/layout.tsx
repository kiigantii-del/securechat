import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { PWAInstallPrompt } from "@/components/common/pwa-install";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#047857" },
  ],
};

export const metadata: Metadata = {
  title: "SecureChat - Encrypted Messaging",
  description: "Secure and private messaging with end-to-end encryption. Send messages, make voice and video calls. No registration required - admin-managed secure communication.",
  keywords: ["SecureChat", "messaging", "encrypted", "private", "E2E", "WhatsApp alternative", "secure communication"],
  authors: [{ name: "SecureChat" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.svg",
    apple: "/icons/icon-192x192.svg",
  },
  openGraph: {
    title: "SecureChat - Encrypted Messaging",
    description: "Secure and private messaging with end-to-end encryption",
    type: "website",
    icons: [{ url: "/icons/icon-192x192.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SecureChat",
  },
};

// Service worker registration script
const swScript = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(err) {
      console.log('SW registration failed:', err);
    });
  });
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <script dangerouslySetInnerHTML={{ __html: swScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
