# 🚀 Railway Deployment Guide

## Prerequisites
1. Railway account (https://railway.app)
2. GitHub repository with your code
3. Environment variables ready

## Step 1: Connect to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your `seo-page-generator` repository

## Step 2: Configure Environment Variables

In Railway dashboard, go to your project → Variables tab and add:

```env
# Database (Railway will provide this)
DATABASE_URL="mysql://..."

# NextAuth
NEXTAUTH_URL="https://your-app-name.railway.app"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Environment
NODE_ENV="production"
```

## Step 3: Database Setup

1. In Railway dashboard, go to "Data" tab
2. Click "New Database" → MySQL
3. Railway will automatically provide the DATABASE_URL
4. Copy the DATABASE_URL to your environment variables

## Step 4: Deploy

1. Railway will automatically detect it's a Next.js app
2. It will run `npm install` and `npm run build`
3. The app will be deployed to a Railway URL

## Step 5: Database Migration

After deployment, run database migrations:

```bash
# In Railway dashboard → Deployments → View Logs
npx prisma migrate deploy
npx prisma generate
```

## Step 6: Test Your App

1. Visit your Railway URL: `https://your-app-name.railway.app`
2. Test the nail admin: `https://your-app-name.railway.app/bookbuy/nail/admin`
3. Create your first page

## Custom Domain (Optional)

1. In Railway dashboard → Settings → Domains
2. Add your custom domain: `bookbuy.ca`
3. Update NEXTAUTH_URL to your custom domain

## Monitoring

- Railway provides built-in monitoring
- Check logs in Railway dashboard
- Monitor database usage
- Set up alerts for errors

## Scaling

Railway automatically scales based on traffic. You can also:
- Set manual scaling limits
- Monitor resource usage
- Upgrade plan as needed

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Railway logs for errors
2. **Database connection**: Verify DATABASE_URL is correct
3. **Environment variables**: Ensure all required vars are set
4. **Migration errors**: Run `npx prisma migrate reset` if needed

### Commands to run in Railway:
```bash
# Reset database
npx prisma migrate reset --force

# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

## Production Checklist

- [ ] Environment variables set
- [ ] Database connected and migrated
- [ ] Custom domain configured (optional)
- [ ] Google Analytics tracking working
- [ ] Test nail admin functionality
- [ ] Monitor error logs
- [ ] Set up backups (Railway provides automatic backups)

## URLs After Deployment

- **Main App**: `https://your-app-name.railway.app`
- **Nail Admin**: `https://your-app-name.railway.app/bookbuy/nail/admin`
- **Nail History**: `https://your-app-name.railway.app/bookbuy/nail/admin/history`
- **Generated Pages**: `https://your-app-name.railway.app/[handle]`

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app 