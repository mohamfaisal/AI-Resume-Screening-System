const nextConfig = {
  reactStrictMode: false, 
  
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production' 
      ? false 
      : { properties: ['^bis_.*'] }, 
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;