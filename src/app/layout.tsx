import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic Workflow Scanner | Eric Macedo",
  description:
    "Visualizador interativo de arquitetura agêntica de IA — Trilha dos Juros.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-slate-950 antialiased`}>
        {children}
      </body>
    </html>
  );
}
