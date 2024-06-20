// /app/layout.tsx

import React from "react";
import { Providers } from "./providers";
import type { Metadata } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params, searchParams }: any): Promise<Metadata> {
    return {
        title: {
            default: 'Acme',
            template: '%s | Acme',
        },
    };
}

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
    const session = await getServerSession(authOptions);

    return (
        <html lang="en">
        <body className="
                text-primary-text
                bg-primary-background
                prose-p:text-primary-text
                prose-headings:text-primary-text
                prose-p:text-primary-text
                prose-a:text-primary-hyperlink
                prose-a:no-underline
                hover:prose-a:text-primary-accent
            ">
        <Providers session={session}>
            {children}
        </Providers>
        </body>
        </html>
    );
}
