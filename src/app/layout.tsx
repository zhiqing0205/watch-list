import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "剧海拾遗 - 专业的影视追踪和管理平台",
  description: "专业的影视收藏和追踪平台，整合豆瓣和TMDB数据，帮您管理观看记录，发现优质影视内容。",
  icons: {
    icon: [
      {
        url: '/icon',
        sizes: '32x32',
        type: 'image/svg+xml',
      }
    ],
    apple: [
      {
        url: '/apple-icon',
        sizes: '180x180',
        type: 'image/svg+xml',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('watch-list-theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldBeDark = stored === 'dark' || (stored !== 'light' && systemDark);
                  
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
