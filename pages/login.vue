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
  if (error) console.log(error);

  toast.add({ title: 'Check your inbox for a sign in link!' })
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
    <UButton @click="signInWithOtp" class="mt-5" :disabled="clicked">Sign In with E-Mail</UButton>
  </div>
</template>
