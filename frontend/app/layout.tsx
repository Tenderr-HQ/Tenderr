
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tenderr — A space where your voice matters",
    template: "%s | Tenderr",
  },
  description:
    "A space where your voice matters. Share your thoughts, connect with others and feel heard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
