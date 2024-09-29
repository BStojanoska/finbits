<template>
  <div v-if="lists?.body && lists?.body.length > 0">
    <div class="text-xl">All your financial lists</div>

    <div v-for="list in lists?.body" :key="list?.name ?? list.id">
      <Card
        class="mt-3 hover:cursor-pointer"
        @click="router.push({ path: `/fin/${list?.id}/bits` })"
      >
        <template #title>
          <div class="flex flex-nowrap justify-between">
            {{ list?.name }}
            <!-- TODO add date range depending on the bits dates -->

            <div>
              <Button
                class="mr-4"
                severity="secondary"
                outlined
                @click="$event.stopPropagation();router.push({ path: `/fin/${list?.id}` })"
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
    @click="router.push({ path: '/new' })"
  >
    <template #icon>
      <font-awesome-icon icon="fa-solid fa-plus" />
    </template>
  </Button>
</template>

<script setup lang="ts">
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

useHead({
  titleTemplate: "FinBits",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});
const router = useRouter();
const confirm = useConfirm();
const toast = useToast();

const {
  data: lists,
  error,
  refresh,
} = useFetch("/api/fins", { method: "GET" });

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
      const results = await $fetch(`/api/fin/${id}`, {
        method: "DELETE",
      });

      console.log(results);
      if (results?.status === 204) {
        toast.add({
          severity: "success",
          summary: "Deleted",
          detail: "Record deleted",
          life: 3000,
        });
        refresh();
      } else {
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
