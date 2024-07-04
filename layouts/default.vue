<template>
  <div class="w-full h-full flex flex-row">
    <div class="flex flex-col w-full mx-10 my-5">
      <div class="flex flex-row w-full justify-between">
        <h1 class="text-2xl font-bold p-3">FinBits</h1>
        <UButton class="flex-shrink-0" icon="i-heroicons-plus-20-solid">
          New
        </UButton>
      </div>
      <div class="px-5 py-16">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>
