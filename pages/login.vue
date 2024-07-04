<script setup lang="ts">
definePageMeta({
  layout: "login",
});
const supabase = useSupabaseClient();
const email = ref("");

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: "http://localhost:3000/confirm",
    },
  });
  if (error) console.log(error);
};
</script>
<template>
  <div class="flex flex-col justify-center items-center w-[100vw] h-[100vh]">
    <h1 class="text-3xl mb-5">Finbits</h1>
    <UInput
      v-model="email"
      variant="outline"
      type="email"
      placeholder="example@gmail.com"
      class="w-[300px]"
      autofocus
      autocomplete="email"
    />
    <UButton @click="signInWithOtp" class="mt-5">Sign In with E-Mail</UButton>
  </div>
</template>
