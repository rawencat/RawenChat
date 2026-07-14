import type { Metadata } from "next";
import "./globals.css";
import { Viewport } from "next";
import { APP_INFO } from "@/constants/config";

export const viewport: Viewport = {
  themeColor: APP_INFO.THEME_COLOR,
};

export const metadata: Metadata = {
  title: APP_INFO.NAME,
  description: APP_INFO.DESCRIPTION,
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className=" min-h-screen">
      <body className="antialiased  text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
