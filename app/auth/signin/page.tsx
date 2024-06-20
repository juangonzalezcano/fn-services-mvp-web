'use client';

import { getProviders, signIn, ClientSafeProvider } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const SignInComponent = () => {
    const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null);
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    useEffect(() => {
        const fetchProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        fetchProviders();
    }, []);

    if (!providers) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            {Object.values(providers).map((provider) => (
                <div key={provider.name}>
                    <button onClick={() => signIn(provider.id, { callbackUrl })}>
                        Sign in with {provider.name}
                    </button>
                </div>
            ))}
        </div>
    );
};

const SignIn = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInComponent />
        </Suspense>
    );
};

export default SignIn;
