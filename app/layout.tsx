import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "notsuscato — ephemeral notes",
  description: "Anonymous, ephemeral, and simple note taking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="h-full bg-[#fafafa] text-zinc-900 overflow-hidden font-sans">
        {children}
      </body>
    </html>
  );
}
