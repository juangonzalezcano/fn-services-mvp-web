// /app/providers.tsx

'use client';
import React from "react";
import AuthContext from "./AuthContext";
import { Session } from "next-auth";

export function Providers({ children, session }: { children: React.ReactNode, session: Session | null }) {
    return (
            <AuthContext session={session}>
                {children}
            </AuthContext>
    );
}
