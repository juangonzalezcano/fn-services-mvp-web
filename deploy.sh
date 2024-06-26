#!/bin/zsh

# Function to read and prompt for environment variables
read_env_var() {
  local var_name=$1
  local var_value=$2
  if [ -n "$var_value" ]; then
    read "?${var_name} is currently set to [${var_value}]. Press Enter to keep or type a new value: " input
    if [ -n "$input" ]; then
      echo $input
    else
      echo $var_value
    fi
  else
    read "?Enter ${var_name}: " input
    echo $input
  fi
}

# Load existing .env.local file if it exists
if [ -f .env.local ]; then
  echo "Loading existing .env.local file..."
  set -a
  source .env.local
  set +a
else
  touch .env.local
fi

# Print debug information to see if variables are loaded
echo "Current environment variables from .env.local:"
env | grep -E 'AUTH_GOOGLE_ID|AUTH_GOOGLE_SECRET|NEXTAUTH_URL|NEXT_PUBLIC_NEXTAUTH_URL|AUTH_SECRET|NEXT_PUBLIC_FIREBASE_API_KEY|NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN|NEXT_PUBLIC_FIREBASE_PROJECT_ID|NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET|NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|NEXT_PUBLIC_FIREBASE_APP_ID|CONTENTFUL_SPACE_ID|CONTENTFUL_ACCESS_TOKEN'

# Prompt for environment variables with existing values as default
AUTH_GOOGLE_ID=$(read_env_var "AUTH_GOOGLE_ID" "${AUTH_GOOGLE_ID}")
AUTH_GOOGLE_SECRET=$(read_env_var "AUTH_GOOGLE_SECRET" "${AUTH_GOOGLE_SECRET}")
NEXTAUTH_URL=$(read_env_var "NEXTAUTH_URL" "${NEXTAUTH_URL}")
NEXT_PUBLIC_NEXTAUTH_URL=$(read_env_var "NEXT_PUBLIC_NEXTAUTH_URL" "${NEXT_PUBLIC_NEXTAUTH_URL}")
AUTH_SECRET=$(read_env_var "AUTH_SECRET" "${AUTH_SECRET}")
NEXT_PUBLIC_FIREBASE_API_KEY=$(read_env_var "NEXT_PUBLIC_FIREBASE_API_KEY" "${NEXT_PUBLIC_FIREBASE_API_KEY}")
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$(read_env_var "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}")
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$(read_env_var "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "${NEXT_PUBLIC_FIREBASE_PROJECT_ID}")
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$(read_env_var "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}")
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$(read_env_var "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}")
NEXT_PUBLIC_FIREBASE_APP_ID=$(read_env_var "NEXT_PUBLIC_FIREBASE_APP_ID" "${NEXT_PUBLIC_FIREBASE_APP_ID}")
NEXT_PUBLIC_CONTENTFUL_SPACE_ID=$(read_env_var "NEXT_PUBLIC_CONTENTFUL_SPACE_ID" "${NEXT_PUBLIC_CONTENTFUL_SPACE_ID}")
NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=$(read_env_var "NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN" "${NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN}")

# Write the updated values back to the .env.local file
echo "Updating .env.local file..."
cat <<EOF > .env.local
AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET
NEXTAUTH_URL=$NEXTAUTH_URL
NEXT_PUBLIC_NEXTAUTH_URL=$NEXT_PUBLIC_NEXTAUTH_URL
AUTH_SECRET=$AUTH_SECRET
NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_CONTENTFUL_SPACE_ID=$NEXT_PUBLIC_CONTENTFUL_SPACE_ID
NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=$NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN
EOF

# Use the environment variables in the gcloud run deploy command
gcloud run deploy fn-services-mvp-web --source . --platform managed --allow-unauthenticated \
  --set-env-vars AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID,AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET,NEXTAUTH_URL=$NEXTAUTH_URL,AUTH_SECRET=$AUTH_SECRET,NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_NEXTAUTH_URL=$NEXT_PUBLIC_NEXTAUTH_URL,NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN=$NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN,NEXT_PUBLIC_CONTENTFUL_SPACE_ID=$NEXT_PUBLIC_CONTENTFUL_SPACE_ID
