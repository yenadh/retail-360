import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../../../src/app/globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Retail360 Account Access",
  description: "Sign in, register, and recover your Retail360 account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="flex min-h-screen flex-col bg-slate-950">{children}</body>
    </html>
  );
}
