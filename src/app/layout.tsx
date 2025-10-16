import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { siteConfig } from "@/config/site";
import { PerformanceMonitor } from "@/components/performance-monitor";
import "./globals.css";

// 主字体 - Geist Sans (现代几何无衬线，适合UI)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // 优化字体加载，避免FOIT
  preload: true,
  weight: ['400', '500', '600', '700'], // 精确控制字重
  adjustFontFallback: true, // 自动调整后备字体
});

// 等宽字体 - Geist Mono (代码显示)
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600'],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // 解决iOS刘海屏问题
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
        <PerformanceMonitor />
      </body>
    </html>
  );
}
