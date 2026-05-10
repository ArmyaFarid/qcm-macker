import type { Metadata } from "next";
import "./globals.css";
import qcmData from "@/data/qcm.json";

export const metadata: Metadata = {
    title: qcmData.meta.title,
    description: "Quiz interactif",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="fr">
            <body className="antialiased">{children}</body>
        </html>
    );
}
