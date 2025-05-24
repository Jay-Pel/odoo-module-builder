import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/Common/ErrorBoundary";
import { ToastProvider } from "@/components/UI/ToastProvider";
import ClickEffect from "@/components/Common/ClickEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odoo Module Builder - AI-Powered Module Generation",
  description: "Transform your business requirements into fully functional Odoo modules with our intelligent AI assistant. No coding required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <ClickEffect />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
