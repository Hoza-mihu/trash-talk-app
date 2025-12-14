import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Eco-Eco Trash Talk",
  description: "AI-powered waste tracking companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInitScript = `
    (function() {
      const STORAGE_KEY = 'theme';
      const stored = localStorage.getItem(STORAGE_KEY);
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const theme = stored === 'light' || stored === 'dark' ? stored : system;
      document.documentElement.setAttribute('data-theme', theme);
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <div className="fixed top-3 right-3 z-50">
          <ThemeToggle />
        </div>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}