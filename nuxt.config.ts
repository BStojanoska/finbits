// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from "@primevue/themes/aura";

export default defineNuxtConfig({
  app: {
    head: {
      script: [
        {
          src: "https://accounts.google.com/gsi/client",
        },
      ],
    },
  },

  devtools: { enabled: true },

  routeRules: {
    '/fin/**': {
      ssr: false,
    }
  },

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
    'nuxt-vue3-google-signin',
  ],

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },

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

  compatibilityDate: "2025-02-22",

  nitro: {
    routeRules: {
      '/api/**': { cors: true }
    },
    // handlers: [
    //   {
    //     route: '/**',
    //     handler: './server/middleware/auth.ts'
    //   }
    // ]
  },
});