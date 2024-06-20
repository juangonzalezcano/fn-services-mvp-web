#!/bin/zsh

# Prompt for environment variables
echo "GOOGLE_CLIENT_ID is the client ID for your Google OAuth application."
read "?Enter GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID

echo "GOOGLE_CLIENT_SECRET is the client secret for your Google OAuth application."
read "?Enter GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET

echo "NEXTAUTH_URL is the base URL for your NextAuth application."
read "?Enter NEXTAUTH_URL: " NEXTAUTH_URL

echo "NEXTAUTH_SECRET is the secret for your NextAuth application."
read "?Enter NEXTAUTH_SECRET: " NEXTAUTH_SECRET

echo "NEXT_PUBLIC_FIREBASE_API_KEY is the API key for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_API_KEY: " NEXT_PUBLIC_FIREBASE_API_KEY

echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is the auth domain for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: " NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN

echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID is the project ID for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_PROJECT_ID: " NEXT_PUBLIC_FIREBASE_PROJECT_ID

echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is the storage bucket for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: " NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is the messaging sender ID for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: " NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

echo "NEXT_PUBLIC_FIREBASE_APP_ID is the app ID for your Firebase project."
read "?Enter NEXT_PUBLIC_FIREBASE_APP_ID: " NEXT_PUBLIC_FIREBASE_APP_ID

# Use the environment variables in the gcloud run deploy command
gcloud run deploy fn-services-mvp-web --source . --platform managed --allow-unauthenticated \
  --set-env-vars GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,NEXTAUTH_URL=$NEXTAUTH_URL,NEXTAUTH_SECRET=$NEXTAUTH_SECRET,NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID