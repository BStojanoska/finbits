<template>
  <div class="text-2xl mb-5">{{ fin?.body?.name ?? "" }}</div>
  <UDivider />

  <div class="my-5">
    <form class="flex flex-wrap flex-row gap-3 justify-between items-center pb-5">
      <UInput v-model="name" type="text" placeholder="What?"></UInput>
      <UInput v-model="amount" type="number" placeholder="How much?"></UInput>
      <UInput v-model="category" type="text" placeholder="Category"></UInput>
      <UInput v-model="note" type="text" placeholder="Note"></UInput>
      <UButton
        class="flex-none"
        type="submit"
        icon="i-heroicons-plus-20-solid"
        :loading="creating"
        @click="createExpense"
        >Add</UButton
      >
    </form>

    <div class="my-5">
      <div class="text-xl mb-5">Expenses</div>

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
          <UDivider />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const name = ref("");
const amount = ref("");
const note = ref("");
const category = ref("");
const creating = ref(false);
const toast = useToast();
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

    toast.add({ title: "Expense added successfully!" });
  } catch (e) {
    toast.add({ title: "There was an error adding the expense..." + e });
  } finally {
    creating.value = false;
  }
};
</script>
