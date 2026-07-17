import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages read their JSON datasets from node_modules at runtime via
  // fs, so they must stay external to the server bundle.
  serverExternalPackages: [
    '@countrystatecity/countries',
    '@countrystatecity/phonecodes',
  ],
};

export default nextConfig;
