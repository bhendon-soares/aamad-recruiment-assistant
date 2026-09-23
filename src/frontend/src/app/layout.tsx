import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "Recruitment Assistant",
    description: "Human-in-the-loop evidence-linked candidate review.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}