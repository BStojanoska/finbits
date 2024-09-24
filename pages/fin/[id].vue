<template>
  <div class="text-2xl mb-5">{{ fin?.body?.name ?? "" }}</div>

  <div v-for="(bits, date) in formattedBits" :key="date">
    <div class="font-bold border-b border-gray-600 my-2">
      {{ date }}
    </div>
    <div
      v-for="bit in bits"
      :key="bit.id"
      class="flex flex-col justify-between h-6 hover:cursor-pointer"
      @click="selectedBit = bit"
    >
      <div class="grid grid-cols-3">
        <div>{{ bit.name }}</div>
        <div>{{ bit.amount }}</div>
        <div>{{ bit.categories?.name }}</div>
      </div>
    </div>
  </div>
  <Button
    class="fixed bottom-[20px] right-[20px]"
    rounded
    style="font-size: 1.5rem; padding: 2rem"
    @click="visible = true"
  >
    <template #icon>
      <font-awesome-icon icon="fa-solid fa-plus" />
    </template>
  </Button>

  <ExpenseForm
    :openDialog="visible"
    :refreshItems="refresh"
    :selectedBit="selectedBit"
    @update:openDialog="($event) => (visible = $event)"
  />
</template>

<script setup lang="ts">
import { format } from "date-fns";

const route = useRoute();
const finId = ref(route?.params?.id || "");
const formattedBits = ref();
const visible = ref(false);
const selectedBit = ref(null);

const { data: fin }: { data: any } = useFetch(`/api/fin/${route?.params?.id}`, {
  method: "GET",
});

const { data: bits, refresh } = await useAsyncData(
  "bits",
  async () => {
    const response = await $fetch(`/api/fin/${route?.params?.id}/bits`, {
      method: "GET",
      params: { fin: route?.params?.id },
    });
    return response;
  },
  {
    watch: [finId],
  }
);

const formatByDate = (bits: any) => {
  if (!bits) return;

  const obj: { [key: string]: any[] } = {};

  bits.results.forEach((bit: any) => {
    const formattedDate = format(bit.created_at, "dd/MM/yyyy").toString();
    if (!obj[formattedDate]) {
      obj[formattedDate] = [];
    }
    obj[formattedDate].push(bit);
  });

  return obj;
};

watch(
  bits,
  (value) => {
    console.log('val', value);
    formattedBits.value = formatByDate(value);
  },
  { deep: true, immediate: true }
);
</script>
