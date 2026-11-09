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
    <html lang="tr" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
