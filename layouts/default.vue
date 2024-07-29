<template>
  <div class="w-full h-full flex flex-row">
    <div class="flex flex-col w-full mx-10 mt-5 mb-3">
      <div class="flex flex-row w-full justify-between items-center">
        <div
          class="text-5xl font-bold p-3 cursor-pointer dancing-script"
          @click="router.push({ path: '/' })"
        >
          FinBits
        </div>
      </div>
      <div class="px-3 py-10">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
</script>
