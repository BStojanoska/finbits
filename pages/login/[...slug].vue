<template>
  <div class="flex flex-col justify-center items-center w-[100vw] h-[100vh]">
    <h1 class="text-5xl mb-5 dancing-script">Finbits</h1>
    <div id="supertokensui" />
  </div>
</template>

<script setup lang="ts">
import { initSuperTokensUI } from "../../config/frontend";
useHead({
  titleTemplate: "FinBits | Login",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});

definePageMeta({
  layout: "login",
});
onMounted(() => {
    const loadScript = (src: string) => {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = src;
        script.id = "supertokens-script";
        script.onload = () => {
            initSuperTokensUI();
        };
        document.body.appendChild(script);
    };

    loadScript("https://cdn.jsdelivr.net/gh/supertokens/prebuiltui@v0.48.0/build/static/js/main.81589a39.js");
});
</script>
