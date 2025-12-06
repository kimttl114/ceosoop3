/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    // 서버 사이드에서 canvas 모듈 제외
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      }
      
      // canvas 모듈을 서버 사이드에서 무시
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      )
    }
    
    // 클라이언트 사이드에서 Node.js 모듈 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        canvas: false,
      }
    }
    
    // undici를 클라이언트 번들에서 제외
    config.resolve.alias = {
      ...config.resolve.alias,
      undici: false,
    }
    
    // undici 모듈을 클라이언트 번들에서 무시
    if (!isServer) {
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^undici$/,
        })
      )
    }
    
    return config
  },
}

module.exports = nextConfig

