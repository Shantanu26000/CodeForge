
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CodeForge | Online Judge",
  description: "Practice coding problems and improve your programming skills.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
