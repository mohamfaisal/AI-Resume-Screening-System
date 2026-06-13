import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabling strict mode often stops these deep hydration warnings
  compiler: {
    // This removes the properties the extension adds before React hydrates
    reactRemoveProperties: process.env.NODE_ENV === 'production' 
      ? false 
      : { properties: ['^bis_.*'] }, 
  },
};

export default nextConfig;