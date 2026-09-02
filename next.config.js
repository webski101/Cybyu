/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/verifier/*": [
        "./verifier/bin/cybyu-host",
        "./verifier/proofs/*.bin"
      ]
    }
  }
};

module.exports = nextConfig;
