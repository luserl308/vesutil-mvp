import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Vesutil — вторсырьё и услуги", description: "Поиск предложений по вторсырью и услугам в Москве и Московской области." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ru"><body>{children}</body></html>; }
