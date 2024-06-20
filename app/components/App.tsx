'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const App = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    if (status === 'loading') {
        return <p>Loading...</p>;
    }

    if (status === 'unauthenticated') {
        return <p>Redirecting...</p>;
    }

    return (
        <> HELLO WORLD </>
    );
};

export default App;
