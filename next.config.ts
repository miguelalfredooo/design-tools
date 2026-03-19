import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/api/design/:path*",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking (framing the app in malicious sites)
          { key: "X-Frame-Options", value: "DENY" },
          // Referrer policy (don't leak referrer to external sites)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permission policy (prevent certain browser features)
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
