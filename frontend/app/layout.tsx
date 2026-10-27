import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CodeForge | Online Judge",
  description: "Practice coding problems and improve your programming skills.",
};

const themeScript = `
(function () {
  try {
    var savedTheme = localStorage.getItem("codeforge-theme");
    var theme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}