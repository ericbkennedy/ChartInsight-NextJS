/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["mysql2"], // See https://github.com/sidorares/node-mysql2/issues/1885
    },
}

module.exports = nextConfig
