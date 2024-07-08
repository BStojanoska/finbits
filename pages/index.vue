<template>
  <div class="text-xl">All your financial lists</div>

  <div v-for="list in lists?.body">
    <UCard
      class="mt-5 hover:cursor-pointer"
      @click="router.push({ path: `/${list?.id}` })"
    >
      <template #header>
        {{ list?.name }}
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "FinBits",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});
const router = useRouter();

const { data: lists, error } = useFetch("/api/fins", { method: "GET" });
</script>
