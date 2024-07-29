<script setup lang="ts">
useHead({
  titleTemplate: "FinBits | Login",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});

definePageMeta({
  layout: "login",
});
const toast = useToast();
const supabase = useSupabaseClient();
const email = ref("");
const clicked = ref(false);

const signInWithOtp = async () => {
  if (clicked.value) return;

  clicked.value = true;

  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: "http://localhost:3000/confirm",
    },
  });
  if (error)
    toast.add({
      summary: "There was an error during the login!",
      severity: "error",
    });
  else toast.add({ summary: "Check your inbox for a sign in link!", severity: "success" });
};
</script>
<template>
  <div class="flex flex-col justify-center items-center w-[100vw] h-[100vh]">
    <h1 class="text-5xl mb-5 dancing-script">Finbits</h1>
    <InputText
      v-model="email"
      type="email"
      placeholder="example@gmail.com"
      class="w-[300px]"
      autofocus
      autocomplete="email"
    />
    <Button @click="signInWithOtp" class="mt-5" :disabled="clicked"
      >Sign In with E-Mail</Button
    >
  </div>
</template>
