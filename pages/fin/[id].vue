<template>
  <div class="text-2xl mb-5">{{ fin?.body?.name ?? "" }}</div>
  <UDivider />

  <div>
    
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const { data: fin }: { data: any } = useFetch(`/api/fin/${route?.params?.id}`, {
  method: "GET",
});

console.log("data", fin);
</script>
