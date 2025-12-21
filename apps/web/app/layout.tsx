
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Antigravity Ticket",
  description: "Your gateway to the best performances",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col font-sans bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
