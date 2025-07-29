import { notFound } from 'next/navigation'
import { prisma } from '@/lib/database'
import { Metadata } from 'next'
import './page.css'
import Image from 'next/image'

interface PageProps {
  params: Promise<{ handle: string }>
}

// Function to generate table of contents from content
function generateTableOfContents(content: string): string {
  if (!content) return ''
  
  // Extract headings from content
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h[2-3]>/g
  const headings: Array<{level: number, text: string, id: string}> = []
  let match
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].replace(/<[^>]*>/g, '') // Remove any HTML tags
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    
    headings.push({ level, text, id })
  }
  
  if (headings.length === 0) return ''
  
  // Generate TOC HTML
  let tocHtml = '<ul class="toc-list">\n'
  
  headings.forEach((heading, index) => {
    const indent = (heading.level - 2) * 20 // 20px indent per level
    tocHtml += `<li class="toc-item" style="margin-left: ${indent}px">\n`
    tocHtml += `<a href="#${heading.id}" class="toc-link" onclick="scrollToHeading('${heading.id}'); return false;">${heading.text}</a>\n`
    tocHtml += '</li>\n'
  })
  
  tocHtml += '</ul>'
  
  return tocHtml
}

// Function to add IDs to headings in content
function addIdsToHeadings(content: string): string {
  if (!content) return content
  
  return content.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h[2-3]>/g,
    (match, level, attributes, text) => {
      const cleanText = text.replace(/<[^>]*>/g, '') // Remove any HTML tags
      const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      return `<h${level}${attributes} id="${id}">${text}</h${level}>`
    }
  )
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
      images: (page as any).openGraphImage ? [(page as any).openGraphImage] : [],
    },
  }
}

export default async function DynamicPage({ params }: PageProps) {
  const resolvedParams = await params
  const page = await prisma.page.findUnique({
    where: { handle: resolvedParams.handle },
  })

  if (!page) notFound()

  // Fetch related articles for this page
  const relatedArticlesResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/internal-links?mainPageId=${page.id}`)
  const relatedArticlesData = relatedArticlesResponse.ok ? await relatedArticlesResponse.json() : { internalLinks: [] }
  const relatedArticles = relatedArticlesData.internalLinks || []

  // Prepare schema data safely
  const schemaData = (page as any).faqSchema ? JSON.stringify((page as any).faqSchema) : null

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl">
        {/* Breadcrumbs */}
        <nav className="mb-8">
          <ol>
            <li><a href="/">Home</a></li>
            <li>/</li>
            <li>{page.mainKeyword}</li>
          </ol>
        </nav>

        {/* Main Content */}
        <h1 className="text-4xl">{page.mainKeyword}</h1>
        
        {/* Table of Contents */}
        {(page as any).content && (
          <div className="toc-section">
            <h2>Table of Contents</h2>
            <div dangerouslySetInnerHTML={{ __html: generateTableOfContents((page as any).content) }} />
          </div>
        )}
        
        {/* Main Content */}
        {(page as any).content && (
          <div className="prose">
            <div dangerouslySetInnerHTML={{ __html: addIdsToHeadings((page as any).content) }} />
          </div>
        )}

        {/* Related Articles Section - First Placement */}
        {relatedArticles.length > 0 && (
          <div className="related-articles-section">
            <h3>Related Articles</h3>
            <div className="related-articles-grid">
              {relatedArticles.slice(0, 2).map((link: any) => {
                const relatedPage = link.relatedPage
                return (
                  <div key={link.id} className="related-article-card">
                    <div className="article-category">Related</div>
                    {relatedPage.images && relatedPage.images.length > 0 && (
                      <Image
                        src={relatedPage.images[0].filePath}
                        alt={relatedPage.images[0].altText}
                        width={400}
                        height={300}
                      />
                    )}
                    <h4>
                      <a href={`/${relatedPage.handle}`}>{relatedPage.mainKeyword}</a>
                    </h4>
                    <p>
                      {relatedPage.content ? 
                        relatedPage.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' :
                        `Learn more about ${relatedPage.mainKeyword} and how it relates to this topic.`
                      }
                    </p>
                    <a href={`/${relatedPage.handle}`} className="read-more">
                      Read More →
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Images Section */}
        {(page as any).images && (page as any).images.length > 0 && (
          <div className="images-section">
            <h2>Images</h2>
            <div>
              {(page as any).images.map((image: any, index: number) => (
                <div key={image.id} className="image-item">
                  <Image 
                    src={image.filePath} 
                    alt={image.altText}
                    width={400}
                    height={300}
                  />
                  <p>{image.altText}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles Section - Second Placement */}
        {relatedArticles.length > 2 && (
          <div className="related-articles-section">
            <h3>More Related Articles</h3>
            <div className="related-articles-grid">
              {relatedArticles.slice(2).map((link: any) => {
                const relatedPage = link.relatedPage
                return (
                  <div key={link.id} className="related-article-card">
                    <div className="article-category">Related</div>
                    {relatedPage.images && relatedPage.images.length > 0 && (
                      <Image
                        src={relatedPage.images[0].filePath}
                        alt={relatedPage.images[0].altText}
                        width={400}
                        height={300}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4>
                      <a href={`/${relatedPage.handle}`}>{relatedPage.mainKeyword}</a>
                    </h4>
                    <p>
                      {relatedPage.content ? 
                        relatedPage.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' :
                        `Learn more about ${relatedPage.mainKeyword} and how it relates to this topic.`
                      }
                    </p>
                    <a href={`/${relatedPage.handle}`} className="read-more">
                      Read More →
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        {(page as any).faqContent && (
          <div className="faq-section">
            <h2>Frequently Asked Questions</h2>
            <div dangerouslySetInnerHTML={{ __html: (page as any).faqContent }} />
          </div>
        )}

        {/* FAQ Schema */}
        {schemaData && (
          <div 
            data-schema={schemaData}
            id="faq-schema-container"
            style={{ display: 'none' }}
          />
        )}
      </div>
      
      {/* Client-side script to handle schema */}
      {schemaData && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                (function() {
                  try {
                    const container = document.getElementById('faq-schema-container');
                    if (container) {
                      const schemaData = container.getAttribute('data-schema');
                      if (schemaData) {
                        const script = document.createElement('script');
                        script.type = 'application/ld+json';
                        script.textContent = schemaData;
                        document.head.appendChild(script);
                      }
                    }
                  } catch (error) {
                    console.warn('Schema injection failed:', error);
                  }
                })();
              }
            `,
          }}
        />
      )}
      
      {/* Client-side script for smooth scrolling */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              function scrollToHeading(headingId) {
                try {
                  const element = document.getElementById(headingId);
                  if (element) {
                    element.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start'
                    });
                    
                    // Add a temporary highlight effect
                    element.style.backgroundColor = '#fef3c7';
                    element.style.transition = 'background-color 0.3s ease';
                    
                    setTimeout(() => {
                      element.style.backgroundColor = '';
                    }, 2000);
                  }
                } catch (error) {
                  console.warn('Scroll to heading failed:', error);
                }
              }
              
              // Create back to top button
              function createBackToTopButton() {
                const existingButton = document.getElementById('back-to-top');
                if (existingButton) return existingButton;
                
                const button = document.createElement('button');
                button.id = 'back-to-top';
                button.className = 'back-to-top-button';
                button.title = 'Back to Top';
                
                button.innerHTML = \`
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m18 15-6-6-6 6"/>
                  </svg>
                \`;
                
                // Add click handler
                button.addEventListener('click', function() {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                });
                
                // Add hover effects
                button.addEventListener('mouseenter', function() {
                  this.classList.add('hover');
                });
                
                button.addEventListener('mouseleave', function() {
                  this.classList.remove('hover');
                });
                
                document.body.appendChild(button);
                return button;
              }
              
              // Add smooth scrolling to all anchor links
              document.addEventListener('DOMContentLoaded', function() {
                try {
                  const tocLinks = document.querySelectorAll('.toc-link');
                  tocLinks.forEach(link => {
                    link.addEventListener('click', function(e) {
                      e.preventDefault();
                      const href = this.getAttribute('href');
                      const headingId = href.replace('#', '');
                      scrollToHeading(headingId);
                    });
                  });
                  
                  // Create and setup back to top button
                  const backToTopButton = createBackToTopButton();
                  
                  function toggleBackToTop() {
                    if (window.scrollY > 300) {
                      backToTopButton.classList.add('visible');
                    } else {
                      backToTopButton.classList.remove('visible');
                    }
                  }
                  
                  // Show/hide button on scroll
                  window.addEventListener('scroll', toggleBackToTop);
                  
                  // Initial check
                  toggleBackToTop();
                  
                } catch (error) {
                  console.warn('Client-side functionality failed:', error);
                }
              });
            }
          `,
        }}
      />
    </div>
  )
} 