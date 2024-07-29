<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <Toast />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} | FinBits` : "FinBits";
  },
});
</script>

<style lang="scss">
@use "~/assets/main.scss";
</style>
