const config = useRuntimeConfig()

if (!config.public.apiDomain || !config.public.websiteDomain) {
    throw new Error("NUXT_API_DOMAIN and NUXT_WEBSITE_DOMAIN must be set");
}

export const appInfo = {
    appName: "Finbits",
    apiDomain: config.public.apiDomain,
    websiteDomain: config.public.websiteDomain,
    apiBasePath: "/api/auth",
    websiteBasePath: "/auth",
};
