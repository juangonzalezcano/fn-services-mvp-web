// /app/layout.tsx

import React from "react";
import '@/app/globals.css';
import {getAuthenticatedAppForUser} from "@/lib/firebase/serverApp";


export default async function RootLayout({ children }: { children: React.ReactNode; }) {
    const { currentUser } = await getAuthenticatedAppForUser();

    return (
        <html lang="en">

        <body>
            {children}
        </body>
        </html>
    );
}
