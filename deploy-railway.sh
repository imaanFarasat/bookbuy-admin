#!/bin/bash

echo "🚀 Preparing for Railway deployment..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "git init"
    echo "git add ."
    echo "git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote is set
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No remote repository found. Please add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/seo-page-generator.git"
    exit 1
fi

echo "✅ Git repository ready"

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy to Railway - $(date)"
git push origin main

echo "✅ Code pushed to GitHub"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Create new project"
echo "3. Connect your GitHub repository"
echo "4. Add environment variables (see DEPLOYMENT.md)"
echo "5. Railway will automatically deploy your app"
echo ""
echo "Your app will be available at: https://your-app-name.railway.app"
echo "Nail admin will be at: https://your-app-name.railway.app/bookbuy/nail/admin" 