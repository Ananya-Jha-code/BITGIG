import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BITGIG | Expert annotation for lab & medical data",
  description:
    "Gemini drafts every segment. Verified lab experts correct it. Consensus checks every task.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider delayDuration={200}>
          <Navbar />
          <main className="flex flex-1 flex-col">{children}</main>
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </body>
    </html>
  );
}
