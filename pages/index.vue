<template>
  <div v-if="lists && lists.length > 0">
    <div class="text-xl">All your financial lists</div>

    <div v-for="list in lists" :key="list.id">
      <Card
        class="mt-3 hover:cursor-pointer"
        @click="router.push({ path: `/fin/${list?.id}/bits` })"
      >
        <template #title>
          <div class="flex flex-nowrap justify-between items-center">
            <div class="flex flex-col">
              <div class="flex-grow mr-4">
                {{ list?.name }}
                <span v-if="list?.total_amount" class="ml-2 text-lg font-semibold">
                  - {{ formatCurrency(list.total_amount) }}
                </span>
              </div>
              <div class="text-right flex-shrink-0">
                <span v-if="list?.date_from && list?.date_to" class="text-sm text-gray-500">
                  {{ formatDate(list.date_from) }} - {{ formatDate(list.date_to) }}
                </span>
              </div>
            </div>
            <div>
              <Button
                class="mr-4"
                severity="secondary"
                outlined
                @click="
                  $event.stopPropagation();
                  router.push({ path: `/fin/${list?.id}` });
                "
              >
                <font-awesome-icon icon="fa-solid fa-pen" />
              </Button>
              <Button
                severity="danger"
                outlined
                @click="confirmDelete($event, list?.id)"
              >
                <font-awesome-icon icon="fa-solid fa-trash" />
              </Button>
            </div>
          </div>
        </template>
      </Card>
    </div>
    <ConfirmDialog />
  </div>
  <div v-else>
    <span class="text-gray-400 italic">No lists, no expenses, no problems</span>
    😊
  </div>

  <Button
    class="bottom-[20px] right-[20px]"
    rounded
    style="font-size: 1.5rem; padding: 2rem; position: fixed"
    @click="router.push({ path: '/fin/+' })"
  >
    <template #icon>
      <font-awesome-icon icon="fa-solid fa-plus" />
    </template>
  </Button>
</template>

<script setup lang="ts">
import { format } from 'date-fns'; // Import date-fns format function
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import * as Session from "supertokens-web-js/recipe/session";

interface List {
  id: string;
  name: string;
  date_from: string;
  date_to: string;
  total_amount: number;
}

useHead({
  titleTemplate: "FinBits",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();
const userId = ref<string | null>(null);

onMounted(async () => {
  const session = await Session.doesSessionExist();
  if (!session) {
    router.push("/auth");
  }
  await getUserInfo();
});

const getUserInfo = async () => {
  const session = await Session.doesSessionExist();
  if (session) {
    userId.value = await Session.getUserId();
  }
};

// Helper function to format currency
const formatCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return '';
  const numberValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numberValue);
};

// Helper function to format date
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    // Assuming dateString is in ISO format or recognizable by Date constructor
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString; // Return original string if formatting fails
  }
};

const {
  data: lists,
  error,
  refresh,
} = useFetch<List[]>("/api/fins", {
  method: "GET",
});

const confirmDelete = ($event: any, id: number | string) => {
  $event.stopPropagation();
  confirm.require({
    message: "Do you want to delete this list?",
    header: "Danger Zone",
    icon: "pi pi-info-circle",
    rejectLabel: "Cancel",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
    },
    accept: async () => {
      try {
        await $fetch(`/api/fin/${id}`, {
          method: "DELETE",
        });

        // Successfully deleted
        toast.add({
          severity: "success",
          summary: "Deleted",
          detail: "Record deleted",
          life: 3000,
        });
        refresh();
      } catch (err) {
        console.error("Error deleting record:", err);
        toast.add({
          severity: "error",
          summary: "Error",
          detail: "There was an error deleting the record!",
          life: 3000,
        });
      }
    },
  });
};
</script>
