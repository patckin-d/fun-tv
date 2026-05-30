import type { Metadata } from "next";
import { Dela_Gothic_One, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const delaGothicOne = Dela_Gothic_One({
  variable: "--font-dela-gothic-one",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "fun.tv — включи и не выключай",
  description:
    "Интерактивный сайт-телевизор с юмористическими шоу на русском языке. Никакого выбора — просто нажми Play.",
  openGraph: {
    title: "fun.tv — включи и не выключай",
    description: "Бесконечный поток лучшего рунет-юмора по каналам.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistMono.variable} ${delaGothicOne.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
