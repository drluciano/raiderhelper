/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...existing config...
  images: {
    domains: ["cdn.arctracker.io"],
    // or use remotePatterns for more flexibility
    // remotePatterns: [{ protocol: "https", hostname: "cdn.arctracker.io" }],
  },
};

module.exports = nextConfig;