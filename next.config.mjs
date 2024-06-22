/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        AUTH_SECRET: process.env.AUTH_SECRET,
        GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_ID,
        GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_SECRET,
        CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID,
        CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
        ],
    },
};

export default nextConfig;
