<template>
  <div class="text-2xl mb-5">{{ fin?.body?.name ?? "" }}</div>

  <div
    v-if="
      bitsResponse?.results && Object.keys(bitsResponse?.results).length > 0
    "
  >
    <div v-for="(bits, date) in bitsResponse?.results" :key="date">
      <div class="grid grid-cols-3 font-bold border-b border-gray-600 my-2">
        <div>{{ date }}</div>
        <div>
          {{ bitsResponse?.totals[date] }}
        </div>
      </div>
      <div class="grid grid-cols-3">
        <template v-for="bit in bits" :key="bit.id">
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
            {{ bit.name }}
          </div>
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
            {{
              new Intl.NumberFormat("de-DE", {
                style: "decimal",
                maximumFractionDigits: 2,
                minimumFractionDigits: 2,
              }).format(bit.amount)
            }}
          </div>
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
            {{ bit.categories?.name }}
          </div>
        </template>
      </div>
    </div>
  </div>
  <div v-else>
    <span class="text-gray-400 italic">No expenses yet.</span>
  </div>

  <Button
    class="bottom-[20px] right-[20px]"
    rounded
    style="font-size: 1.5rem; padding: 2rem; position: fixed"
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
    @update:selectedBit="($event) => (selectedBit = $event)"
  />
</template>

<script setup lang="ts">
const route = useRoute();
const finId = ref(route?.params?.id || "");
const visible = ref(false);
const selectedBit = ref(null);

const { data: fin }: { data: any } = useFetch(`/api/fin/${route?.params?.id}`, {
  method: "GET",
});

const { data: bitsResponse, refresh } = await useAsyncData(
  "bits",
  async () => {
    const response = await $fetch(`/api/fin/${route?.params?.id}/bits`, {
      method: "GET",
    });
    return response;
  },
  {
    watch: [finId],
  }
);
</script>
