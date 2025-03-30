<template>
  <slot />
</template>

<script setup lang="ts">
import { initSuperTokensWebJS } from "../config/frontend";

initSuperTokensWebJS();
</script>