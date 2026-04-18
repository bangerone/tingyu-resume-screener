/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    serverComponentsExternalPackages: [
      'pdf-parse',
      'mammoth',
      'mysql2',
      'cos-nodejs-sdk-v5',
    ],
  },
};
export default nextConfig;
