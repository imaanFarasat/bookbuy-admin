import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { handle: params.handle },
      include: {
        images: true,
        keywords: true
      }
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Debug page data
    console.log('🔍 DEBUG: Page Data Analysis')
    console.log('🔍 Page ID:', page.id)
    console.log('🔍 Page Handle:', page.handle)
    console.log('🔍 Main Keyword:', page.mainKeyword)
    console.log('🔍 Content Length:', page.content?.length || 0)
    console.log('🔍 Content Preview:', page.content?.substring(0, 200) + '...')
    
    // Check for image placeholders in content
    const imagePlaceholderCount = (page.content?.match(/<!-- Image will be added by user later -->/g) || []).length
    const imgTagCount = (page.content?.match(/<img/g) || []).length
    console.log('🔍 Image Placeholders in content:', imagePlaceholderCount)
    console.log('🔍 IMG tags in content:', imgTagCount)
    
    // Check for specific content sections
    const h2Sections = page.content?.match(/<h2[^>]*>.*?<\/h2>/g) || []
    console.log('🔍 H2 sections found:', h2Sections.length)
    console.log('🔍 H2 sections:', h2Sections.map(h2 => h2.replace(/<[^>]*>/g, '').trim()))
    console.log('🔍 Hero Section:', (page as any).heroSection)
    console.log('🔍 Banner Ads:', (page as any).bannerAds)
    console.log('🔍 Images Count:', page.images?.length || 0)
    console.log('🔍 Images:', page.images?.map(img => ({ 
      filePath: img.filePath ? img.filePath.substring(0, 100) + '...' : 'empty',
      filePathLength: img.filePath?.length || 0,
      altText: img.altText,
      fileSize: img.fileSize
    })))
    
    // Check for Base64 images
    const base64Images = page.images?.filter(img => img.filePath?.startsWith('data:image/')) || []
    console.log('🔍 Base64 Images Count:', base64Images.length)
    console.log('🔍 Base64 Image Sizes:', base64Images.map(img => img.fileSize))
    
    // Debug hero section data
    console.log('🔍 Hero section data:', {
      heroSection: (page as any).heroSection,
      buttonUrl: (page as any).heroSection?.buttonUrl,
      buttonText: (page as any).heroSection?.buttonText,
      hasButtonUrl: !!(page as any).heroSection?.buttonUrl,
      hasButtonText: !!(page as any).heroSection?.buttonText
    })

    // Generate the HTML template
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
    
    <!-- Custom CSS for hero image links -->
    <style>
        .hero-image-link {
            display: block;
            text-decoration: none;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hero-image-link:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .hero-image-link .hero-image {
            transition: filter 0.3s ease;
        }
        
        .hero-image-link:hover .hero-image {
            filter: brightness(1.1);
        }
        
        .hero-image-link .image-overlay {
            transition: opacity 0.3s ease;
        }
        
        .hero-image-link:hover .image-overlay {
            opacity: 0.8;
        }
    </style>
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
                                                    ${(page as any).heroSection?.buttonUrl ? `
                                                    <a href="${(page as any).heroSection.buttonUrl}" class="book-button">
                                                        ${(page as any).heroSection?.buttonText || 'Learn More'}
                                                    </a>
                                                    ` : `<div style="background: red; color: white; padding: 10px; margin: 10px 0; border-radius: 5px;">
                                                        DEBUG: No button data<br>
                                                        buttonUrl: ${(page as any).heroSection?.buttonUrl || 'null'}<br>
                                                        buttonText: ${(page as any).heroSection?.buttonText || 'null'}
                                                    </div>`}
                                                </div>
                                            </div>
                                            
                                            <div class="images-container">
                                                <div class="images-grid">
                                                    ${(page as any).heroSection?.image1 ? `
                                                    <div class="image-wrapper">
                                                        ${(page as any).heroSection?.buttonUrl ? `
                                                        <a href="${(page as any).heroSection.buttonUrl}" class="hero-image-link">
                                                            <img src="${(page as any).heroSection.image1}" alt="${(page as any).heroSection?.alt1 || 'Hero Image 1'}" class="hero-image">
                                                            <div class="image-overlay overlay-first"></div>
                                                        </a>
                                                        ` : `
                                                        <img src="${(page as any).heroSection.image1}" alt="${(page as any).heroSection?.alt1 || 'Hero Image 1'}" class="hero-image">
                                                        <div class="image-overlay overlay-first"></div>
                                                        `}
                                                    </div>
                                                    ` : ''}
                                                    ${(page as any).heroSection?.image2 ? `
                                                    <div class="image-wrapper image-second">
                                                        ${(page as any).heroSection?.buttonUrl ? `
                                                        <a href="${(page as any).heroSection.buttonUrl}" class="hero-image-link">
                                                            <img src="${(page as any).heroSection.image2}" alt="${(page as any).heroSection?.alt2 || 'Hero Image 2'}" class="hero-image">
                                                            <div class="image-overlay overlay-second"></div>
                                                        </a>
                                                        ` : `
                                                        <img src="${(page as any).heroSection.image2}" alt="${(page as any).heroSection?.alt2 || 'Hero Image 2'}" class="hero-image">
                                                        <div class="image-overlay overlay-second"></div>
                                                        `}
                                                    </div>
                                                    ` : ''}
                                                    ${!((page as any).heroSection?.image1 || (page as any).heroSection?.image2) && page.images && page.images.length > 0 ? `
                                                    <div class="image-wrapper">
                                                        ${(page as any).heroSection?.buttonUrl ? `
                                                        <a href="${(page as any).heroSection.buttonUrl}" class="hero-image-link">
                                                            <img src="${page.images[0].filePath}" alt="${page.images[0].altText}" class="hero-image">
                                                            <div class="image-overlay overlay-first"></div>
                                                        </a>
                                                        ` : `
                                                        <img src="${page.images[0].filePath}" alt="${page.images[0].altText}" class="hero-image">
                                                        <div class="image-overlay overlay-first"></div>
                                                        `}
                                                    </div>
                                                    ${page.images.length > 1 ? `
                                                    <div class="image-wrapper image-second">
                                                        ${(page as any).heroSection?.buttonUrl ? `
                                                        <a href="${(page as any).heroSection.buttonUrl}" class="hero-image-link">
                                                            <img src="${page.images[1].filePath}" alt="${page.images[1].altText}" class="hero-image">
                                                            <div class="image-overlay overlay-second"></div>
                                                        </a>
                                                        ` : `
                                                        <img src="${page.images[1].filePath}" alt="${page.images[1].altText}" class="hero-image">
                                                        <div class="image-overlay overlay-second"></div>
                                                        `}
                                                    </div>
                                                    ` : ''}
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Main Content -->
                                <div class="content-section">
                                    <!-- DEBUG INFO -->
                                    <div style="background: #f0f0f0; border: 2px solid #333; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 12px;">
                                        <strong>DEBUG INFO:</strong><br>
                                        Content Length: ${page.content?.length || 0}<br>
                                        Image Placeholders: ${(page.content?.match(/<!-- Image will be added by user later -->/g) || []).length}<br>
                                        IMG tags: ${(page.content?.match(/<img/g) || []).length}<br>
                                        H2 sections: ${(page.content?.match(/<h2[^>]*>.*?<\/h2>/g) || []).length}<br>
                                        Images in DB: ${page.images?.length || 0}<br>
                                        Hero Section: ${(page as any).heroSection ? 'Present' : 'Missing'}<br>
                                        Banner Ads: ${(page as any).bannerAds?.length || 0}
                                    </div>
                                    ${(() => {
                                        // Embed images into content
                                        let contentWithImages = page.content || ''
                                        const contentImages = page.images || []
                                        const bannerAds = (page as any).bannerAds || []
                                        
                                        if (contentImages.length > 0) {
                                            // Replace image placeholders with actual images
                                            const h2Sections = contentWithImages.match(/<h2[^>]*>.*?<\/h2>/g) || []
                                            
                                            for (let i = 0; i < h2Sections.length && i < contentImages.length; i++) {
                                                const image = contentImages[i]
                                                
                                                // Only display image if filePath is not empty and valid
                                                if (image.filePath && image.filePath.trim() !== '') {
                                                    // Check if it's a valid Base64 image or external URL
                                                    const isValidImage = image.filePath.startsWith('data:image/') || 
                                                                       image.filePath.startsWith('http') ||
                                                                       image.filePath.startsWith('/')
                                                    
                                                    if (isValidImage) {
                                                        const imageHtml = `<img src="${image.filePath}" alt="${image.altText}" class="img-fluid rounded shadow" loading="lazy" decoding="async" onerror="this.style.display='none'; console.log('Content image failed to load: ' + this.src);" onload="console.log('Content image loaded successfully: ' + this.src)">`
                                                        
                                                        // Replace the placeholder for this section
                                                        contentWithImages = contentWithImages.replace(
                                                            /<!-- Image will be added by user later -->/,
                                                            imageHtml
                                                        )
                                                    } else {
                                                        console.log(`Skipping invalid image path: ${image.filePath.substring(0, 50)}...`)
                                                    }
                                                } else {
                                                    console.log(`Skipping empty image path for image ${i + 1}`)
                                                }
                                            }
                                        }
                                        
                                        // Insert banner ads at appropriate intervals
                                        if (bannerAds.length > 0) {
                                            // Split content by row divs to find good insertion points
                                            const rowPattern = /<div class="row mb-4">/g
                                            const matches = [...contentWithImages.matchAll(rowPattern)]
                                            
                                            if (matches.length > 0) {
                                                let modifiedContent = contentWithImages
                                                let offset = 0
                                                
                                                bannerAds.forEach((banner: any, bannerIndex: number) => {
                                                    // Insert banner after every 2 content rows
                                                    const insertAfterRow = Math.min((bannerIndex + 1) * 2, matches.length)
                                                    
                                                    if (insertAfterRow < matches.length) {
                                                        const match = matches[insertAfterRow - 1]
                                                        const insertPosition = match.index! + match[0].length + offset
                                                        
                                                        const bannerHtml = `
                                                        </div>
                                                        <div class="banner-ad-container">
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
                                                        </div>
                                                        <div class="row mb-4">`
                                                        
                                                        modifiedContent = modifiedContent.slice(0, insertPosition) + bannerHtml + modifiedContent.slice(insertPosition)
                                                        offset += bannerHtml.length
                                                    }
                                                })
                                                
                                                contentWithImages = modifiedContent
                                            } else {
                                                // If no row divs found, just append banners at the end
                                                const bannerHtml = bannerAds.map((banner: any) => `
                                                <div class="banner-ad-container">
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
                                                </div>`).join('')
                                                
                                                contentWithImages += bannerHtml
                                            }
                                        }
                                        
                                        return contentWithImages
                                    })()}
                                </div>
                                
                                <!-- FAQ content is already embedded in the main content -->
                                
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
    
    <!-- Client-side Debug Script -->
    <script>
        console.log('CLIENT-SIDE DEBUG: Page loaded');
        console.log('Page URL:', window.location.href);
        console.log('Content sections found:', document.querySelectorAll('.content-section').length);
        console.log('IMG tags found:', document.querySelectorAll('img').length);
        console.log('Image placeholders found:', (document.body.innerHTML.match(/<!-- Image will be added by user later -->/g) || []).length);
        console.log('H2 tags found:', document.querySelectorAll('h2').length);
        
        // Log all images
        document.querySelectorAll('img').forEach(function(img, index) {
            console.log('Image ' + index + ':', {
                src: img.src,
                alt: img.alt,
                className: img.className,
                visible: img.offsetWidth > 0 && img.offsetHeight > 0
            });
        });
        
        // Log all H2 sections
        document.querySelectorAll('h2').forEach(function(h2, index) {
            console.log('H2 ' + index + ':', h2.textContent.trim());
        });
    </script>
</body>
</html>
    `

    return new Response(templateHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error serving page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 