import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: ["@whatisjery/react-fluid-distortion"],
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "three",
      "@react-three/drei",
    ],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/i,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
