import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || 'nature'
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '12'
    
    // Get Pexels API key from environment
    const pexelsApiKey = process.env.PEXELS_API_KEY
    
    if (!pexelsApiKey) {
      // Return sample data for testing when API key is not configured
      console.log('Pexels API key not found, returning sample data')
      return NextResponse.json({
        success: true,
        images: [
          {
            id: 1,
            url: 'https://picsum.photos/400/300?random=1',
            alt: 'Sample business meeting',
            photographer: 'Sample Photographer',
            width: 400,
            height: 300,
            originalUrl: 'https://picsum.photos/800/600?random=1',
            largeUrl: 'https://picsum.photos/1200/900?random=1',
            thumbnailUrl: 'https://picsum.photos/200/150?random=1'
          },
          {
            id: 2,
            url: 'https://picsum.photos/400/300?random=2',
            alt: 'Sample technology',
            photographer: 'Sample Photographer',
            width: 400,
            height: 300,
            originalUrl: 'https://picsum.photos/800/600?random=2',
            largeUrl: 'https://picsum.photos/1200/900?random=2',
            thumbnailUrl: 'https://picsum.photos/200/150?random=2'
          },
          {
            id: 3,
            url: 'https://picsum.photos/400/300?random=3',
            alt: 'Sample digital marketing',
            photographer: 'Sample Photographer',
            width: 400,
            height: 300,
            originalUrl: 'https://picsum.photos/800/600?random=3',
            largeUrl: 'https://picsum.photos/1200/900?random=3',
            thumbnailUrl: 'https://picsum.photos/200/150?random=3'
          },
          {
            id: 4,
            url: 'https://picsum.photos/400/300?random=4',
            alt: 'Sample kitchen knives',
            photographer: 'Sample Photographer',
            width: 400,
            height: 300,
            originalUrl: 'https://picsum.photos/800/600?random=4',
            largeUrl: 'https://picsum.photos/1200/900?random=4',
            thumbnailUrl: 'https://picsum.photos/200/150?random=4'
          }
        ],
        total: 4,
        page: 1,
        perPage: 12,
        hasMore: false,
        message: 'Using sample data. Add PEXELS_API_KEY to .env.local for real images.'
      })
    }
    
    // Call Pexels API
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`, 
      {
        headers: {
          'Authorization': pexelsApiKey
        }
      }
    )
    
    if (!response.ok) {
      console.error('Pexels API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Pexels API error response:', errorText)
      return NextResponse.json({ 
        error: 'Failed to fetch images from Pexels',
        status: response.status,
        details: errorText
      }, { status: response.status })
    }
    
    const data = await response.json()
    
    console.log('Pexels API response:', {
      total: data.total_results,
      photos: data.photos?.length,
      firstPhoto: data.photos?.[0]
    })
    
    // Transform the data to match our needs
    const images = data.photos?.map((photo: any) => {
      console.log('Processing photo:', {
        id: photo.id,
        url: photo.src?.medium,
        alt: photo.alt
      })
      
      return {
        id: photo.id,
        url: photo.src?.medium || photo.src?.large || photo.src?.original, // Fallback chain
        alt: photo.alt || query,
        photographer: photo.photographer,
        width: photo.width,
        height: photo.height,
        originalUrl: photo.src?.original,
        largeUrl: photo.src?.large,
        thumbnailUrl: photo.src?.small
      }
    }) || []
    
    return NextResponse.json({
      success: true,
      images,
      total: data.total_results || 0,
      page: parseInt(page),
      perPage: parseInt(perPage),
      hasMore: data.next_page ? true : false
    })
    
  } catch (error) {
    console.error('Image search error:', error)
    return NextResponse.json({ 
      error: 'Failed to search images',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 