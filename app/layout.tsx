import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import { ScrollReset } from "@/components/site/scroll-reset";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saswati’s Kitchen",
  description: "Fresh homemade Bengali meals delivered daily in Barrackpore.",
  icons: {
    icon: "/brand/logo.jpg",
    apple: "/brand/logo.jpg",
    shortcut: "/brand/logo.jpg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
        <ScrollReset />
      </body>
    </html>
  );
}
