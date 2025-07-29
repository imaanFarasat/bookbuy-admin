const { PrismaClient } = require('@prisma/client')

// Use the Railway MySQL URL format
const DATABASE_URL = "mysql://root:RfaRlNBPxRdaPsrrmAGKiHXBQacmqcNB@metro.proxy.rlwy.net:52978/railway"

console.log('🔗 Using Railway database URL...')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function emergencyCleanup() {
  try {
    console.log('🚨 EMERGENCY DATABASE CLEANUP - DELETING ALL TEST PAGES')
    console.log('🔗 Connecting to database...')
    
    // Test the connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Get total count
    const totalPages = await prisma.page.count()
    console.log(`📊 Total pages before cleanup: ${totalPages}`)
    
    if (totalPages === 0) {
      console.log('✅ Database is already empty!')
      return
    }
    
    // Delete all images first
    const imageCount = await prisma.image.count()
    if (imageCount > 0) {
      await prisma.image.deleteMany({})
      console.log(`🗑️  Deleted ${imageCount} images`)
    }
    
    // Delete all keywords
    const keywordCount = await prisma.keyword.count()
    if (keywordCount > 0) {
      await prisma.keyword.deleteMany({})
      console.log(`🗑️  Deleted ${keywordCount} keywords`)
    }
    
    // Delete all pages
    const deletedPages = await prisma.page.deleteMany({})
    console.log(`🗑️  Deleted ${deletedPages.count} pages`)
    
    // Final count
    const finalCount = await prisma.page.count()
    console.log(`\n📊 Final page count: ${finalCount}`)
    console.log(`🎉 EMERGENCY CLEANUP COMPLETED! Database is now empty.`)
    
  } catch (error) {
    console.error('❌ Error during emergency cleanup:', error)
    console.error('Error details:', error.message)
    
    if (error.message.includes('Unknown database')) {
      console.error('💡 Make sure your DATABASE_URL is correct')
    }
    
    if (error.message.includes('Connection')) {
      console.error('💡 Make sure your database is accessible')
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Run the emergency cleanup
emergencyCleanup() 