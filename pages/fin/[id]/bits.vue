<template>
  <ChartComponent :categoryTotals="bitsResponse?.categoryTotals || []" />
  <div class="flex flex-row justify-between items-center">
    <div>
      <div class="text-2xl mb-1">
        {{ fin?.name ?? "" }}
        <span v-if="fin?.total_amount" class="ml-2 text-xl font-semibold">
          ({{ formatCurrency(fin.total_amount) }})
        </span>
      </div>
      <div
        v-if="fin?.date_from && fin?.date_to"
        class="text-sm text-gray-500 mb-5"
      >
        {{ formatDate(fin.date_from) }} - {{ formatDate(fin.date_to) }}
      </div>
    </div>

    <!-- Share button - Conditionally rendered -->
    <div v-if="fin?.isOwner" class="flex flex-row gap-2">
      <Button
        class="text-white font-bold py-2 px-4 rounded"
        @click="shareModal = true"
      >
        <template #icon>
          <font-awesome-icon icon="fa-solid fa-share-nodes" />
        </template>
      </Button>
    </div>
    <ShareModal
      :openDialog="shareModal"
      :finId="finId"
      @update:openDialog="($event) => (shareModal = $event)"
      />
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
      <div class="grid grid-cols-4">
        <template v-for="bit in bits" :key="bit.id">
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
            <Avatar :label="bit.user_email ? bit.user_email?.slice(0,1).toUpperCase() : '?'" class="mr-2" style="background-color: #dee9fc; color: #1a2551" shape="circle" />
          </div>
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
            {{ bit.name }}
          </div>
          <div class="hover:cursor-pointer" @click="selectedBit = bit">
              {{ bit.amount }}
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
import { format } from "date-fns";
import ShareModal from '~/components/ShareModal.vue';
import { ChartComponent } from '#components';
import Avatar from 'primevue/avatar';

const route = useRoute();
const finId = ref(route?.params?.id || "");
const visible = ref(false);
const selectedBit = ref<Bit | null>(null);
const shareModal = ref(false);

interface FinDetails {
  name: string;
  total_amount: number | string | null;
  date_from: string | null;
  date_to: string | null;
  isOwner?: boolean;
}

interface Bit {
  id: string;
  name: string;
  amount: string;
  category_name: string;
  category_id?: string;
  date: string;
  note: string;
  user_email: string | null;
}

interface CategoryTotal {
  category_id: string | number;
  category_name: string;
  total_amount: number;
  formatted_amount: string;
}

interface BitsResponse {
  results: Record<string, Bit[]>;
  totals: Record<string, number>;
  categoryTotals: CategoryTotal[];
}

// Fetch fin details and get its refresh function
const { data: fin, refresh: refreshFin } = useFetch<FinDetails>(
  `/api/fin/${route?.params?.id}`,
  {
    method: "GET",
    key: `fin-${finId.value}`,
  }
);

const { data: bitsResponse, refresh } = await useAsyncData<BitsResponse>(
  "bits",
  async () => {
    const response = await $fetch<BitsResponse>(`/api/fin/${route?.params?.id}/bits`, {
      method: "GET",
    });
    return response;
  },
  {
    watch: [finId],
  }
);

const refreshAllData = () => {
  refresh();
  refreshFin();
};
const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "";
  const numberValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numberValue);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString;
  }
};
</script>
