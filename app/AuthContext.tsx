// /app/AuthContext.tsx

"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { ReactNode } from "react";

export interface AuthContextProps {
    children: ReactNode;
    session: Session | null;
}

export default function AuthContext({ children, session }: AuthContextProps) {
    return <SessionProvider session={session}>{children}</SessionProvider>;
}
