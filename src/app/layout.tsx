import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { TripProvider } from "@/providers/TripProvider";
import AppHeader from "@/components/layout/AppHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripPlanner - Plan Your Perfect Trip",
  description: "A modern trip planning application to organize flights, accommodation, places to visit, and daily itineraries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TripProvider>
            <AppHeader />
            <main className="min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </TripProvider>
        </AuthProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
