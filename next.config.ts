import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision: Date.now().toString() }],
  cacheOnNavigation: true,
  // A reload on reconnect would drop in-memory edits; queued writes flush without one.
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({});
