const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDatabase() {
  try {
    console.log('🧹 Starting database cleanup...')
    
    // Get total pages count
    const totalPages = await prisma.page.count()
    console.log(`📊 Total pages in database: ${totalPages}`)
    
    // Get pages with their sizes
    const pages = await prisma.page.findMany({
      include: {
        images: true,
        keywords: true
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    })
    
    console.log('\n📋 Pages found:')
    pages.forEach((page, index) => {
      const contentSize = page.content?.length || 0
      const faqSize = page.faqContent?.length || 0
      const imageCount = page.images?.length || 0
      const keywordCount = page.keywords?.length || 0
      const totalSize = contentSize + faqSize
      
      console.log(`${index + 1}. ${page.mainKeyword} (${page.handle})`)
      console.log(`   Created: ${page.createdAt}`)
      console.log(`   Content: ${contentSize} chars, FAQ: ${faqSize} chars`)
      console.log(`   Images: ${imageCount}, Keywords: ${keywordCount}`)
      console.log(`   Total size: ${totalSize} chars`)
      console.log('')
    })
    
    // Delete pages older than 24 hours (for testing)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    
    const oldPages = await prisma.page.findMany({
      where: {
        createdAt: {
          lt: oneDayAgo
        }
      },
      include: {
        images: true,
        keywords: true
      }
    })
    
    console.log(`🗑️  Found ${oldPages.length} pages older than 24 hours to delete:`)
    oldPages.forEach(page => {
      console.log(`   - ${page.mainKeyword} (${page.handle}) created at ${page.createdAt}`)
    })
    
    if (oldPages.length > 0) {
      // Delete associated data first
      for (const page of oldPages) {
        // Delete images
        if (page.images.length > 0) {
          await prisma.image.deleteMany({
            where: { pageId: page.id }
          })
          console.log(`   Deleted ${page.images.length} images for ${page.mainKeyword}`)
        }
        
        // Delete keywords
        if (page.keywords.length > 0) {
          await prisma.keyword.deleteMany({
            where: { pageId: page.id }
          })
          console.log(`   Deleted ${page.keywords.length} keywords for ${page.mainKeyword}`)
        }
      }
      
      // Delete pages
      const deletedPages = await prisma.page.deleteMany({
        where: {
          createdAt: {
            lt: oneDayAgo
          }
        }
      })
      
      console.log(`✅ Deleted ${deletedPages.count} old pages`)
    }
    
    // Delete pages with very large content (over 50KB)
    const largePages = await prisma.page.findMany({
      where: {
        OR: [
          { content: { not: null } },
          { faqContent: { not: null } }
        ]
      },
      include: {
        images: true,
        keywords: true
      }
    })
    
    const pagesToDelete = largePages.filter(page => {
      const contentSize = page.content?.length || 0
      const faqSize = page.faqContent?.length || 0
      const totalSize = contentSize + faqSize
      return totalSize > 50000 // 50KB
    })
    
    console.log(`\n📏 Found ${pagesToDelete.length} pages with large content (>50KB):`)
    pagesToDelete.forEach(page => {
      const contentSize = page.content?.length || 0
      const faqSize = page.faqContent?.length || 0
      const totalSize = contentSize + faqSize
      console.log(`   - ${page.mainKeyword}: ${totalSize} chars`)
    })
    
    if (pagesToDelete.length > 0) {
      // Delete associated data first
      for (const page of pagesToDelete) {
        // Delete images
        if (page.images.length > 0) {
          await prisma.image.deleteMany({
            where: { pageId: page.id }
          })
          console.log(`   Deleted ${page.images.length} images for ${page.mainKeyword}`)
        }
        
        // Delete keywords
        if (page.keywords.length > 0) {
          await prisma.keyword.deleteMany({
            where: { pageId: page.id }
          })
          console.log(`   Deleted ${page.keywords.length} keywords for ${page.mainKeyword}`)
        }
      }
      
      // Delete large pages
      const deletedLargePages = await prisma.page.deleteMany({
        where: {
          id: {
            in: pagesToDelete.map(p => p.id)
          }
        }
      })
      
      console.log(`✅ Deleted ${deletedLargePages.count} large pages`)
    }
    
    // Final count
    const finalCount = await prisma.page.count()
    console.log(`\n📊 Final page count: ${finalCount}`)
    console.log(`🎉 Cleanup completed! Freed up space by deleting ${totalPages - finalCount} pages`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the cleanup
cleanupDatabase() 