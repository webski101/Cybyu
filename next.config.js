/** @type {import('next').NextConfig} */
const tracedVerifierFiles = [
  "./verifier/bin/cybyu-host",
  "./verifier/proofs/*.bin"
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/verifier/*": tracedVerifierFiles,
      "/api/workloads/*": tracedVerifierFiles,
      "/api/proofs/*": tracedVerifierFiles,
      "/proof/*": tracedVerifierFiles
    }
  }
};

module.exports = nextConfig;
