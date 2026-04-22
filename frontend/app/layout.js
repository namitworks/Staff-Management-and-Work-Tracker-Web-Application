import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import InstallPWA from "@/components/shared/InstallPWA";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const viewport = {
  themeColor: "#1A3A5C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export const metadata = {
  title: "DD Infoways - Management System",
  description: "Internal staff and work management system for DD Infoways Limited NZ.",
  manifest: "/manifest.json",
  icons: {
    apple: "/icons/icon-192.png"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DD Staff"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        {children}
        <Toaster richColors position="top-right" />
        <InstallPWA />
      </body>
    </html>
  );
}
