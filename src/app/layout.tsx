import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slushi Squad",
  description: "Cold cups. Big dreams. Made in the neighborhood."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
