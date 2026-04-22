import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-network-first",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24
        },
        networkTimeoutSeconds: 10
      }
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static-cache-first",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }
      }
    },
    {
      urlPattern: /^https?:\/\/.*\.(?:js|css|png|jpg|jpeg|svg|webp|woff2?)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets-cache-first",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }
      }
    }
  ]
});

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withPWA(nextConfig);
