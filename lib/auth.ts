// src/lib/auth.ts
import {NextRequest} from 'next/server';
import {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth/next';
import {authOptions} from '@/lib/authOptions';

export async function getSessionFromNextRequest(req: NextRequest) {
    const cookie = req.headers.get('cookie') || '';
    const mockRequest = {
        headers: { cookie },
    };

    return await getServerSession(mockRequest as unknown as NextApiRequest, {} as NextApiResponse, authOptions);
}
