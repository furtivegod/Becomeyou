import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  serverExternalPackages: ['playwright'],
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'posthog-js', '@sentry/nextjs']
  }
}

export default withSentryConfig(nextConfig, {
  org: 'Becomeyou', // Replace with your Sentry org
  project: 'becomeyou-project', // Replace with your Sentry project
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})

