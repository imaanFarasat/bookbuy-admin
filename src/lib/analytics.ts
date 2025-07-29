// Google Analytics configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

// Google Analytics event tracking
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Track internal link clicks
export const trackInternalLink = (linkUrl: string, linkText: string) => {
  trackEvent('click', 'internal_link', `${linkText} - ${linkUrl}`)
}

// Track banner ad clicks
export const trackBannerAd = (adTitle: string, adUrl: string) => {
  trackEvent('click', 'banner_ad', `${adTitle} - ${adUrl}`)
}

// Track form submissions
export const trackFormSubmission = (formName: string) => {
  trackEvent('submit', 'form', formName)
}

// Track content engagement
export const trackContentEngagement = (contentType: string, contentTitle: string) => {
  trackEvent('engagement', 'content', `${contentType} - ${contentTitle}`)
}

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event',
      targetId: string,
      config?: {
        page_path?: string
        event_category?: string
        event_label?: string
        value?: number
      }
    ) => void
    dataLayer: any[]
  }
} 