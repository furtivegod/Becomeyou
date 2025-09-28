// Analytics - Optional and non-blocking
let posthog: typeof import('posthog-js').default | null = null

export function initAnalytics() {
  // Only initialize in browser and if key exists
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return
  }

  try {
    // Dynamic import to avoid SSR issues
    import('posthog-js').then((module) => {
      posthog = module.default
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        autocapture: false,
        disable_session_recording: true,
        loaded: (posthog: typeof import('posthog-js').default) => {
          console.log('Analytics initialized')
        }
      })
    }).catch((error) => {
      console.warn('Analytics failed to load:', error)
    })
  } catch (error) {
    console.warn('Analytics initialization failed:', error)
  }
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog) {
    return
  }

  try {
    posthog.capture(eventName, properties)
  } catch (error) {
    console.warn('Event tracking failed:', error)
  }
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !posthog) {
    return
  }

  try {
    posthog.identify(userId, properties)
  } catch (error) {
    console.warn('User identification failed:', error)
  }
}