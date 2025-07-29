# SEO Page Generator

A powerful Next.js application for generating SEO-optimized pages with AI-powered content, internal linking, and comprehensive page management.

## ⚠️ CRITICAL DEVELOPMENT RULE

**NEVER ADD PRE-WRITTEN CONTENT OR SUGGESTIONS**

- AI must decide what to write about keywords - no hardcoded content allowed
- This rule applies to ALL content generation functions in this codebase
- Only provide structure and placeholders to AI
- Let AI generate completely original content based on its knowledge

## 🚀 Features

- **AI-Powered Content Generation** - Generate unique, SEO-optimized content for any keyword
- **Internal Linking System** - Create relationships between pages for better SEO
- **Page History & Management** - Edit, regenerate, and manage all generated pages
- **Image Management** - Upload and optimize images with alt text
- **FAQ Generation** - Automatically generate FAQ sections with structured data
- **Meta Tag Optimization** - Generate optimized titles and descriptions
- **Google Analytics Integration** - Track page views and user interactions
- **Responsive Design** - Mobile-friendly templates with modern UI

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.2 with App Router
- **Database**: MySQL with Prisma ORM
- **AI**: OpenAI API for content generation
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form with Zod validation
- **Drag & Drop**: DND Kit for reordering
- **Image Processing**: Sharp for optimization
- **Analytics**: Google Analytics 4

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seo-page-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Required environment variables:
   ```env
   DATABASE_URL="mysql://..."
   OPENAI_API_KEY="sk-..."
   NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

1. **Create a New Page**
   - Navigate to the dashboard
   - Enter your main keyword
   - Add content sections and keywords
   - Generate content, FAQ, and meta tags
   - Upload images and configure banner ads
   - Save and download your page

2. **Manage Pages**
   - View all generated pages in the History section
   - Edit existing pages with the full editor
   - Regenerate content or update images
   - Delete pages as needed

3. **Internal Linking**
   - Use the Internal Linking page to connect related pages
   - Create SEO-friendly relationships between your content
   - Related pages will appear as a carousel on generated pages

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── generate-content/   # Content generation
│   │   ├── generate-meta/      # Meta tag generation
│   │   ├── generate-faq/       # FAQ generation
│   │   ├── pages/              # Page management
│   │   └── internal-links/     # Internal linking
│   ├── dashboard/              # Main dashboard
│   │   ├── history/           # Page history
│   │   ├── internal-linking/  # Internal linking
│   │   └── edit/              # Page editing
│   └── [handle]/              # Generated pages
├── components/                 # Reusable components
├── lib/                       # Utilities and configurations
└── types/                     # TypeScript type definitions
```

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

### Railway
```bash
railway up
```

### Netlify
```bash
npm run build
netlify deploy --prod
```

## 📊 Analytics

The application includes Google Analytics 4 integration:
- Page view tracking
- Internal link click tracking
- Banner ad click tracking
- Form submission tracking

## 🔒 Security

- Input validation with Zod schemas
- HTML sanitization with DOMPurify
- Rate limiting on all API endpoints
- XSS protection with Content Security Policy
- SQL injection prevention with Prisma ORM

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
