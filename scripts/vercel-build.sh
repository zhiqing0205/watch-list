#!/bin/bash

# Vercel build script for Prisma
echo "Starting Vercel build process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run the build
echo "Running Next.js build..."
npm run build

echo "Build completed successfully!"