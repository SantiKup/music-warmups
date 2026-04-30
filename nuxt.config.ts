import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxt/image", "@nuxt/icon"],
  css: ["~/assets/main/css/style.css"],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_SUPABASE_ANON_KEY,
      supabaseBucket: process.env.NUXT_SUPABASE_BUCKET || "bandjam-files",
      supabaseAssetsTable: process.env.NUXT_SUPABASE_ASSETS_TABLE || "assets",
    },
  },

  vite: {
    optimizeDeps: {
      include: ["@supabase/supabase-js", "better-auth/vue"],
    },
    plugins: [tailwindcss()],
  },
});