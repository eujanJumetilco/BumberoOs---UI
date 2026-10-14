import type { NextConfig } from "next";

// The BumberoOS server (Spring Boot). Requests to /api/* are proxied here so the
// browser stays same-origin and no CORS setup is needed on the server.
const API_URL = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
