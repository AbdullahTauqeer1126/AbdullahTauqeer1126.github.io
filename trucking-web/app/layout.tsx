import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "TruckApp Pakistan — Book a Truck in 2 Minutes",
  description: "Pakistan's #1 digital trucking marketplace. Real-time GPS, transparent pricing, JazzCash & Easypaisa payments.",
  keywords: "truck booking Pakistan, freight transport, trucking Karachi Lahore Islamabad",
};

import { SupportWidget } from "@/components/layout/SupportWidget";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
        }}
      >
        <AuthProvider>
          {children}
          <SupportWidget />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
