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
  ],

  // googleSignIn: {
  //   clientId: process.env.GOOGLE_CLIENT_ID,
  // },

  runtimeConfig: {
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    SUPERTOKENS_CONNECTION_URI: process.env.SUPERTOKENS_CONNECTION_URI,
    SUPERTOKENS_API_KEY: process.env.SUPERTOKENS_API_KEY,
    public: {
      apiDomain: process.env.NUXT_API_DOMAIN,
      websiteDomain: process.env.NUXT_WEBSITE_DOMAIN,
    },
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