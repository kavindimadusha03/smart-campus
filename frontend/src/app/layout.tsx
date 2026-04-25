import type { Metadata } from "next";
import { El_Messiri, Karla } from "next/font/google";
import "../../src/app/globals.css";
import Providers from "./providers";

// Configure El Messiri for headings/topics
const elMessiri = El_Messiri({
  variable: "--font-el-messiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Configure Karla for body text
const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "OrBixa - Smart Campus Management",
  description: "OrBixa - Smart Campus Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${elMessiri.variable} ${karla.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}