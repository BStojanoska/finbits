<template>
  <div class="text-xl">All your financial lists</div>

  <div v-for="list in lists?.body">
    <Card
      class="mt-3 hover:cursor-pointer"
      @click="router.push({ path: `/fin/${list?.id}` })"
    >
      <template #title>
        {{ list?.name }}
        <!-- TODO add date range depending on the bits dates -->
      </template>
    </Card>
  </div>

  <Button
    class="fixed bottom-[20px] right-[20px]"
    rounded
    @click="router.push({ path: '/new' })"
  >
    <template #icon>
      <font-awesome-icon icon="fa-solid fa-plus" />
    </template>
  </Button>
</template>

<script setup lang="ts">
useHead({
  titleTemplate: "FinBits",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});
const router = useRouter();

const { data: lists, error } = useFetch("/api/fins", { method: "GET" });
</script>
