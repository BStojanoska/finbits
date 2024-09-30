<template>
  <div class="flex flex-col justify-center items-center">
    <h2 class="py-5">{{ description }}</h2>
    <form
      class="flex flex-col align-center justify-center w-[90%] md:w-[70%] lg:w-[50%] xl:w-[30%]"
    >
      <InputText v-model="name" type="text" placeholder="Name" :key="data?.body?.name ?? 'new'"></InputText>
      <Button
        class="flex-none m-auto my-5 px-5"
        type="submit"
        :loading="creatingList"
        @click="createList"
        >Save</Button
      >
    </form>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

const finId = ref(useRoute().params.id);

const { data, error } = useFetch<{
  status: number;
  body: { name: string };
}>(`/api/fin/${finId.value}`, {
  method: "GET",
});

const name = ref("");
watchEffect(() => {
  name.value = data.value?.body?.name || "";
});

const description = computed(() =>
  data.value?.status === 200 ? `Edit list` : `Create a new list`
);
const creatingList = ref(false);

useHead({
  titleTemplate: `FinBits | ${description.value}`,
  meta: [{ name: description.value, content: description.value }],
});

const createList = async () => {
  creatingList.value = true;

  try {
    if (data.value?.status !== 200) {
      const results = await $fetch<{ body: { message: string; id: string } }>(
        "/api/fin",
        {
          method: "POST",
          headers: useRequestHeaders(["cookie"]),
          body: JSON.stringify({
            name: name.value.trim(),
          }),
        }
      );

      toast.add({
        summary: "List created successfully!",
        severity: "success",
        life: 5000,
      });
      navigateTo(`/fin/${results?.body?.id}/bits`);
    } else {
      await $fetch<{ body: { message: string; id: string } }>(
        `/api/fin/${finId.value}`,
        {
          method: "PUT",
          headers: useRequestHeaders(["cookie"]),
          body: JSON.stringify({
            name: name.value.trim(),
          }),
        }
      );

      toast.add({
        summary: "List updated!",
        severity: "success",
        life: 5000,
      });
    }
  } catch (e) {
    toast.add({
      summary:
        `There was an error ${data ? "updating" : "creating"} the list...` + e,
      severity: "error",
    });
  } finally {
    creatingList.value = false;
  }
};
</script>
