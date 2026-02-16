import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Network-first for Supabase API calls
    {
      matcher({ url }) {
        return url.hostname.includes("supabase.co");
      },
      handler: new NetworkFirst({
        cacheName: "supabase-api",
        networkTimeoutSeconds: 10,
      }),
    },
    // Cache-first for static assets (fonts, images)
    {
      matcher({ request }) {
        return request.destination === "font";
      },
      handler: new CacheFirst({
        cacheName: "fonts",
      }),
    },
    {
      matcher({ request }) {
        return request.destination === "image";
      },
      handler: new CacheFirst({
        cacheName: "images",
      }),
    },
    // Default Next.js App Router caching (pages, RSC, etc.)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
