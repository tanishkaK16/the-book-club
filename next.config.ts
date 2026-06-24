import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      },
      // lh3.googleusercontent.com removed — Google Sign-In is not used
      {
        // Scoped to the actual Supabase project instead of *.supabase.co wildcard
        protocol: 'https',
        hostname: 'xzngvxhnbdgqkzulrpme.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'covers.openlibrary.org',
      },
    ],
  },
};

export default nextConfig;
