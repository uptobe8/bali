import type { NextConfig } from 'next'

const isStaticExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  output: isStaticExport ? 'export' : 'standalone',
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: false,
}

export default nextConfig
