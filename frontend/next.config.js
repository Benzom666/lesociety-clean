const path = require("path");
require("dotenv").config();

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

module.exports = {
  images: {
    domains: [...(supabaseHost ? [supabaseHost] : [])],
  },

  devIndicators: {
    autoPrerender: false,
    buildActivity: false,
  },

  env: {
    modules: ["auth", "event"],
    MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  },
  async redirects() {
    return [
      // {
      //   source: "/home",
      //   destination: "/",
      //   permanent: true,
      // },
    ];
  },
};
