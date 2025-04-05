<template>
  <div class="text-2xl mb-1"> <!-- Reduced bottom margin -->
    {{ fin?.name ?? "" }}
    <span v-if="fin?.total_amount" class="ml-2 text-xl font-semibold"> <!-- Display total amount -->
      ({{ formatCurrency(fin.total_amount) }})
    </span>
  </div>
  <div v-if="fin?.date_from && fin?.date_to" class="text-sm text-gray-500 mb-5"> <!-- Display date range -->
     {{ formatDate(fin.date_from) }} - {{ formatDate(fin.date_to) }}
  </div>
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
            {{ bit.category_name }}
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
    :refreshItems="refreshAllData"
    :selectedBit="selectedBit"
    @update:openDialog="($event) => (visible = $event)"
    @update:selectedBit="($event) => (selectedBit = $event)"
  />
</template>

<script setup lang="ts">
import { format } from 'date-fns'; // Import date-fns format function
const route = useRoute();
const finId = ref(route?.params?.id || "");
const visible = ref(false);
const selectedBit = ref(null);

// Define an interface for the fin data
interface FinDetails {
  name: string;
  total_amount: number | string | null;
  date_from: string | null;
  date_to: string | null;
}

// Fetch fin details and get its refresh function
const { data: fin, refresh: refreshFin } = useFetch<FinDetails>(`/api/fin/${route?.params?.id}`, {
  method: "GET",
  key: `fin-${finId.value}` // Key helps Nuxt manage refetching
});

const { data: bitsResponse, refresh } = await useAsyncData(
  "bits",
  async () => { // This fetches the bits list
    const response = await $fetch(`/api/fin/${route?.params?.id}/bits`, {
      method: "GET",
    });
    return response;
  },
  {
    watch: [finId], // Watch finId for changes
  }
);

// Combined refresh function to pass to the form
const refreshAllData = () => {
  refresh(); // Refresh bits list (from useAsyncData)
  refreshFin(); // Refresh fin details (from useFetch)
}
// Helper function to format currency (copied from pages/index.vue)
const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '';
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numberValue);
};

// Helper function to format date (copied from pages/index.vue)
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString;
  }
};
</script>
