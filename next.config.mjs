const nextConfig = {
  serverExternalPackages: ['playwright'],
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'posthog-js']
  }
}

export default nextConfig
