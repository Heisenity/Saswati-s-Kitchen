import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/cart-provider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Saswati’s Kitchen",
  description: "Fresh homemade Bengali meals delivered daily in Barrackpore."
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
      </body>
    </html>
  );
}
