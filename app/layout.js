import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import "./oryzo.css";

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
  title: "Owl Journey — A Scroll-Driven Story",
  description:
    "An immersive 6-layer scroll experience with cursor-driven cloud masking, atmospheric depth, and floating content — a journey through the sky.",
  keywords: ["scroll storytelling", "GSAP", "immersive design", "interactive website", "parallax"],
  openGraph: {
    title: "Owl Journey — A Scroll-Driven Story",
    description: "Brush away the clouds and reveal the sky in this immersive scroll-driven experience.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
