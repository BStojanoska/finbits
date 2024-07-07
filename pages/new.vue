<template>
  <div class="flex flex-col justify-center items-center">
    <h2 class="py-5">Create a new list</h2>
    <form
      class="flex flex-col align-center justify-center w-[90%] md:w-[70%] lg:w-[50%] xl:w-[30%]"
    >
      <UInput v-model="name" type="text" placeholder="Name"></UInput>
      <UButton
        class="flex-none m-auto my-5 px-5"
        type="submit"
        @click="createList"
        >Save</UButton
      >
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: "Create a list",
});

const description = ref("Create a new list");
const name = ref("");

useHead({
  titleTemplate: "FinBits | Create a list",
  meta: [{ name: "Create a list", content: description }],
});

const createList = async () => {
  console.log("Creating a new list");

  const response = await $fetch("/api/fin", {
    method: "POST",
    headers: useRequestHeaders(["cookie"]),
    body: JSON.stringify({
      name: name.value.trim(),
    }),
  });
};
</script>
