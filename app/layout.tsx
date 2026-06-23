import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MCTPro — Gestão para vendedores de crediário",
  description: "Substitua o caderno de fiado por uma plataforma completa de vendas, parcelas e cobranças.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}
