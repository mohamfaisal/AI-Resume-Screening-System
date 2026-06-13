import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HireMind AI",
  description: "AI-Powered Hiring Intelligence for UAE Enterprises",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Add suppressHydrationWarning to the body tag here */}
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}