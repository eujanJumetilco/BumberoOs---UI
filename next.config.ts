import type { NextConfig } from "next";

// The BumberoOS server (Spring Boot). Requests to /api/* are proxied here so the
// browser stays same-origin and no CORS setup is needed on the server.
// It is read at build time, so on Vercel it must be set before deploying (a change needs a redeploy).
const API_URL = (process.env.API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

if (process.env.VERCEL && !process.env.API_URL) {
  throw new Error("API_URL is not set. Add it in Vercel → Settings → Environment Variables (e.g. https://your-app.up.railway.app).");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
