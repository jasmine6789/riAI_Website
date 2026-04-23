import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./oryzo.css";
import CookieConsent from "./components/CookieConsent";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "riAI — Wealth intelligence for a confident future",
  description:
    "Human expertise and thoughtful technology to help you plan, protect, and grow wealth—with clarity, not noise.",
  keywords: ["wealth management", "financial planning", "riAI", "investment advisory", "India"],
  openGraph: {
    title: "riAI — Wealth intelligence for a confident future",
    description: "A calm, premium experience for professionals, founders, and families who want clarity in their financial life.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
