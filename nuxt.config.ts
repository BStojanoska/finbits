// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    "@fortawesome/fontawesome-svg-core/styles.css",
    "~/assets/css/main.css",
  ],
  build: {
    transpile: [
      "@fortawesome/vue-fontawesome",
      "@fortawesome/fontawesome-svg-core",
      "@fortawesome/free-solid-svg-icons",
    ],
  },
  modules: [
    "@nuxtjs/supabase",
    "@primevue/nuxt-module",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          "Dancing Script": [700],
          Roboto: [400],
        },
      },
    ],
  ],
  primevue: {
    options: {
      theme: {
        preset: Aura,
      },
    },
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  supabase: {
    // Options
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      include: ["*"],
      exclude: ["login, confirm"],
      cookieRedirect: false,
    },
  },
});
