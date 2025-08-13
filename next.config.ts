import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // App Routerではi18n設定は使用しない
  // 代わりにミドルウェアで言語切り替えを処理
}

export default nextConfig
