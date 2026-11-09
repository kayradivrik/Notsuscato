import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Notsuscato — Ephemeral Minimal Notes",
  description: "Anonymous, ephemeral, and simple note taking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full bg-[#fbfbfd] text-zinc-900 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
