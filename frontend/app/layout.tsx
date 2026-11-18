
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenderr",
  description: "A space where your voice matters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
