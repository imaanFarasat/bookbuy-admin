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
    include: {
      images: true,
      keywords: true
    }
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
    <!-- Original Template CSS -->
    <link rel="stylesheet" href="/templates/templatemo_555_upright/css/templatemo-upright.css">
</head>
<body>
    <div class="tm-main">
        <div class="tm-section-wrap">
            <section class="tm-section">
                <div class="tm-container">
                    <div class="tm-row-home">
                        <div class="tm-col-home">
                            <div class="tm-text-container">
                                <!-- Hero Section -->
                                <div class="hero-container">
                                    <div class="hero-section">
                                        <div class="hero-grid">
                                            <div class="content-left">
                                                <div class="content-text">
                                                    <h1 class="hero-title">
                                                        <span class="title-something">${(page as any).heroSection?.h1 || page.mainKeyword}</span>
                                                        <span class="title-extraordinary">${(page as any).heroSection?.slogan || ''}</span>
                                                    </h1>
                                                    <p class="hero-description">${(page as any).heroSection?.span || ''}</p>
                                                    ${(page as any).heroSection?.buttonUrl && (page as any).heroSection?.buttonText ? `
                                                    <a href="${(page as any).heroSection.buttonUrl}" class="book-button">
                                                        ${(page as any).heroSection.buttonText}
                                                    </a>
                                                    ` : ''}
                                                </div>
                                            </div>
                                            
                                            <div class="images-container">
                                                <div class="images-grid">
                                                    ${(page as any).heroSection?.image1 ? `
                                                    <div class="image-wrapper">
                                                        <img src="${(page as any).heroSection.image1}" alt="${(page as any).heroSection?.alt1 || 'Hero Image 1'}" class="hero-image">
                                                        <div class="image-overlay overlay-first"></div>
                                                    </div>
                                                    ` : ''}
                                                    ${(page as any).heroSection?.image2 ? `
                                                    <div class="image-wrapper image-second">
                                                        <img src="${(page as any).heroSection.image2}" alt="${(page as any).heroSection?.alt2 || 'Hero Image 2'}" class="hero-image">
                                                        <div class="image-overlay overlay-second"></div>
                                                    </div>
                                                    ` : ''}
                                                    ${!((page as any).heroSection?.image1 || (page as any).heroSection?.image2) && page.images && page.images.length > 0 ? `
                                                    <div class="image-wrapper">
                                                        <img src="${page.images[0].filePath}" alt="${page.images[0].altText}" class="hero-image">
                                                        <div class="image-overlay overlay-first"></div>
                                                    </div>
                                                    ${page.images.length > 1 ? `
                                                    <div class="image-wrapper image-second">
                                                        <img src="${page.images[1].filePath}" alt="${page.images[1].altText}" class="hero-image">
                                                        <div class="image-overlay overlay-second"></div>
                                                    </div>
                                                    ` : ''}
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Banner Ads Section -->
                                ${(page as any).bannerAds && (page as any).bannerAds.length > 0 ? `
                                <div class="banner-ad-container">
                                    ${(page as any).bannerAds.map((banner: any, index: number) => `
                                    <div class="banner-ad-content">
                                        <div class="banner-ad-image">
                                            ${banner.image?.url ? `<img src="${banner.image.url}" alt="${banner.image.alt || 'Banner Ad'}" class="img-fluid">` : ''}
                                        </div>
                                        <div class="banner-ad-text">
                                            <h3 class="banner-ad-title">${banner.title || 'Banner Ad'}</h3>
                                            <p class="banner-ad-description">${banner.description || ''}</p>
                                            ${banner.cta ? `<a href="#" class="banner-ad-btn">${banner.cta}</a>` : ''}
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                                ` : ''}
                                
                                <!-- Main Content -->
                                <div class="content-section">
                                    ${page.content || ''}
                                </div>
                                
                                <!-- FAQ Section -->
                                ${page.faqContent ? `
                                <div class="faq-section">
                                    <h2 class="h2-faq-title">Frequently Asked Questions</h2>
                                    <hr class="mb-5">
                                    ${page.faqContent}
                                </div>
                                ` : ''}
                                
                                <!-- Related Images -->
                                ${page.images && page.images.length > 2 ? `
                                <div class="image-section">
                                    <h2 class="h2-related-page">Related Images</h2>
                                    <div class="row">
                                        ${page.images.slice(2).map((image: any) => `
                                        <div class="col-md-6 col-lg-4 mb-4">
                                            <img src="${image.filePath}" alt="${image.altText}" class="content-image">
                                            <p class="mt-2 text-muted">${image.altText}</p>
                                        </div>
                                        `).join('')}
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
    
    <!-- Footer -->
    <footer class="tm-copyright">
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