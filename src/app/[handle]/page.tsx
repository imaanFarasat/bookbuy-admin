import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database'
import { Metadata } from 'next'

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const page = await prisma.page.findUnique({
    where: { handle: resolvedParams.handle },
  })

  if (!page) return { title: 'Page Not Found' }

  return {
    title: page.metaTitle || page.mainKeyword,
    description: page.metaDescription || `Learn more about ${page.mainKeyword}`,
    openGraph: {
      title: page.metaTitle || page.mainKeyword,
      description: page.metaDescription || `Learn more about ${page.mainKeyword}`,
    },
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const resolvedParams = await params
  const page = await prisma.page.findUnique({
    where: { handle: resolvedParams.handle },
  })

  if (!page) notFound()

  // Generate the HTML template similar to dashboard
  const templateHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.metaTitle || page.mainKeyword}</title>
    <meta name="description" content="${page.metaDescription || `Learn more about ${page.mainKeyword}`}">
    ${(page as any).canonical ? `<link rel="canonical" href="https://bookbuy-admin-production.up.railway.app/${page.handle}">` : ''}
    
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-QHV22L1RBX"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-QHV22L1RBX');
    </script>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 0;
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            overflow: hidden;
        }
        
        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.3);
            z-index: 1;
        }
        
        .hero-section .container {
            position: relative;
            z-index: 2;
        }
        
        .hero-section h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            font-weight: bold;
        }
        
        .hero-section p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .hero-section .btn {
            background: #ff6b6b;
            border: none;
            padding: 12px 30px;
            font-size: 1.1rem;
            border-radius: 25px;
            transition: all 0.3s ease;
        }
        
        .hero-section .btn:hover {
            background: #ff5252;
            transform: translateY(-2px);
        }
        
        .hero-images {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
        }
        
        .hero-image {
            width: 200px;
            height: 150px;
            object-fit: cover;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        
        .content-section {
            padding: 40px 0;
        }
        
        .content-section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.2rem;
        }
        
        .content-section h3 {
            color: #34495e;
            margin-bottom: 15px;
            font-size: 1.8rem;
        }
        
        .content-section p {
            margin-bottom: 20px;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        
        .banner-section {
            background: #f8f9fa;
            padding: 40px 0;
            margin: 40px 0;
        }
        
        .banner-ad {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            text-align: center;
            margin-bottom: 20px;
        }
        
        .banner-ad img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        
        .banner-ad h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .banner-ad p {
            color: #666;
            margin-bottom: 20px;
        }
        
        .banner-ad .btn {
            background: #007bff;
            color: white;
            padding: 10px 25px;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .banner-ad .btn:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        
        .image-section {
            margin: 40px 0;
        }
        
        .image-section img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .faq-section {
            background: #f8f9fa;
            padding: 40px 0;
            margin: 40px 0;
        }
        
        .faq-item {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .faq-question {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .faq-answer {
            color: #666;
        }
        
        .related-articles {
            background: #ecf0f1;
            padding: 40px 0;
            margin: 40px 0;
        }
        
        .article-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .article-card:hover {
            transform: translateY(-5px);
        }
        
        .breadcrumb {
            background: #f8f9fa;
            padding: 15px 0;
            margin-bottom: 20px;
        }
        
        .breadcrumb a {
            color: #007bff;
            text-decoration: none;
        }
        
        .breadcrumb a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .hero-section h1 {
                font-size: 2rem;
            }
            
            .hero-section p {
                font-size: 1rem;
            }
            
            .container {
                padding: 10px;
            }
            
            .hero-images {
                flex-direction: column;
                align-items: center;
            }
            
            .hero-image {
                width: 100%;
                max-width: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="breadcrumb">
        <div class="container">
            <a href="/">Home</a> / ${page.mainKeyword}
        </div>
    </div>
    
    <div class="hero-section">
        <div class="container">
            <h1>${page.mainKeyword}</h1>
            ${(page as any).heroSection?.slogan ? `<p>${(page as any).heroSection.slogan}</p>` : ''}
            ${(page as any).heroSection?.buttonUrl ? `<a href="${(page as any).heroSection.buttonUrl}" class="btn btn-light">Learn More</a>` : ''}
            
            ${(page as any).heroSection?.image1 || (page as any).heroSection?.image2 ? `
            <div class="hero-images">
                ${(page as any).heroSection?.image1 ? `<img src="${(page as any).heroSection.image1}" alt="${(page as any).heroSection?.alt1 || page.mainKeyword}" class="hero-image">` : ''}
                ${(page as any).heroSection?.image2 ? `<img src="${(page as any).heroSection.image2}" alt="${(page as any).heroSection?.alt2 || page.mainKeyword}" class="hero-image">` : ''}
            </div>
            ` : ''}
        </div>
    </div>
    
    <div class="content-section">
        <div class="container">
            ${(page as any).content || ''}
        </div>
    </div>
    
    ${(page as any).bannerAds && (page as any).bannerAds.length > 0 ? `
    <div class="banner-section">
        <div class="container">
            ${(page as any).bannerAds.map((banner: any) => `
                <div class="banner-ad">
                    ${banner.image ? `<img src="${banner.image}" alt="Banner Ad">` : ''}
                    <h3>${banner.title || 'Special Offer'}</h3>
                    <p>${banner.description || 'Discover amazing deals and offers.'}</p>
                    ${banner.cta ? `<a href="#" class="btn">${banner.cta}</a>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${(page as any).faqContent ? `
    <div class="faq-section">
        <div class="container">
            <h2>Frequently Asked Questions</h2>
            ${(page as any).faqContent}
        </div>
    </div>
    ` : ''}
    
    ${(page as any).images && (page as any).images.length > 0 ? `
    <div class="image-section">
        <div class="container">
            <h2>Related Images</h2>
            <div class="row">
                ${(page as any).images.map((image: any) => `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <img src="${image.filePath}" alt="${image.altText}" class="img-fluid">
                        <p class="mt-2 text-muted">${image.altText}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    ` : ''}
    
    <footer class="bg-dark text-white text-center py-4 mt-5">
        <div class="container">
            <p>&copy; 2024 ${page.mainKeyword}. All rights reserved.</p>
        </div>
    </footer>
    
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
  `

  return (
    <div dangerouslySetInnerHTML={{ __html: templateHtml }} />
  )
} 