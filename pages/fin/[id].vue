<template>
  <div class="text-2xl mb-5">{{ fin?.body?.name ?? "" }}</div>
  <Divider />

  <div class="my-5">
    <div class="my-5">
      <div class="grid grid-cols-1 gap-3">
        <div
          v-for="bit in bits?.results"
          :key="bit.id"
          class="flex flex-col justify-between"
        >
          <div class="grid grid-cols-4 mb-5">
            <div>{{ bit.name }}</div>
            <div>{{ bit.amount }}</div>
            <div>{{ bit.categories?.name }}</div>
            <div>{{ bit.note }}</div>
          </div>
          <Divider />
        </div>
      </div>
    </div>
  </div>
  <Button
    class="fixed bottom-[20px] right-[20px]"
    rounded
    @click="visible = true"
  >
    <template #icon>
      <font-awesome-icon icon="fa-solid fa-plus" />
    </template>
  </Button>

  <Dialog
    v-model:visible="visible"
    modal
    header="Add expense"
    class="w-[100vw] md:w-[75wv] lg:w-[30vw]"
  >
    <form class="flex flex-col gap-3 justify-between items-center pb-5">
      <InputText v-model="name" type="text" placeholder="What?"></InputText>
      <InputText
        v-model="amount"
        type="number"
        placeholder="How much?"
      ></InputText>
      <InputText
        v-model="category"
        type="text"
        placeholder="Category"
      ></InputText>
      <InputText v-model="note" type="text" placeholder="Note"></InputText>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="visible = false"
        ></Button>
        <Button
          type="button"
          label="Save"
          :loading="creating"
          @click="createExpense"
        ></Button>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const route = useRoute();
const name = ref("");
const amount = ref("");
const note = ref("");
const category = ref("");
const creating = ref(false);
const toast = useToast();
const visible = ref(false);
const finId = ref(route?.params?.id || "");

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

// const { data: categories } = useFetch("/api/categories", { method: "GET" });

const createExpense = async (e: Event) => {
  e.preventDefault();
  creating.value = true;

  const payload = {
    name: name.value.trim(),
    amount: amount.value.toString().trim(),
    note: note.value.trim(),
    category: category.value.trim(),
  };

  try {
    const response = await $fetch(`/api/fin/${route?.params?.id}/bit`, {
      method: "POST",
      headers: useRequestHeaders(["cookie"]),
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error("Error adding expense...");
    }

    refresh();

    toast.add({ summary: "Expense added successfully!", severity: "success" });
  } catch (e) {
    toast.add({
      summary: "There was an error adding the expense..." + e,
      severity: "error",
    });
  } finally {
    creating.value = false;
    visible.value = false;
  }
};
</script>
