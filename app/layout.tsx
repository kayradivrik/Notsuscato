import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "notsuscato — İz Bırakmayan Geçici Not Defteri",
  description: "E-posta veya telefon gerekmez. Notunuzu yazın, süresini belirleyin; süre dolduğunda kalıcı olarak imha edilir.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "notsuscato",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "notsuscato — İz Bırakmayan Geçici Not Defteri",
    description: "Anonim, şifreli ve kendi kendini imha eden modern web not defteri.",
    type: "website",
    siteName: "notsuscato",
  },
  twitter: {
    card: "summary",
    title: "notsuscato",
    description: "İz bırakmayan, geçici web not defteri.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="h-full min-h-[100dvh] bg-[#fafafa] text-zinc-900 overflow-hidden font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});}`,
          }}
        />
      </body>
    </html>
  );
}
