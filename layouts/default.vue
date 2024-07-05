<template>
  <div class="w-full h-full flex flex-row">
    <div class="flex flex-col w-full mx-10 my-5">
      <div class="flex flex-row w-full justify-between items-center">
        <div class="text-5xl font-bold p-3 cursor-pointer" style="font-family: 'Dancing Script';" @click="router.push({ path: '/' })">FinBits</div>
        <UButton class="flex-shrink-0 h-10" icon="i-heroicons-plus-20-solid" @click="router.push({ path: '/new' })">
          <span class="mx-auto">New</span>
        </UButton>
      </div>
      <div class="px-5 py-16">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter();
</script>
