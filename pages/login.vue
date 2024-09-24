<script setup lang="ts">
import {
  GoogleSignInButton,
} from "vue3-google-signin";

useHead({
  titleTemplate: "FinBits | Login",
  meta: [{ name: "FinBits", content: "Financial lists" }],
});

definePageMeta({
  layout: "login",
});
const toast = useToast();
const supabase = useSupabaseClient();
const router = useRouter();

// handle success event
const handleLoginSuccess = async (response: any) => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: response.credential,
  });
  if (data) {
    router.push({ path: "/" });
  }
  toast.add({
    summary: "There was an error during the login! " + error?.message,
    severity: "error",
  });
};

const handleLoginError = () => {
  toast.add({
    summary: "There was an error during the login!",
    severity: "error",
  });
};
</script>

<template>
  <div class="flex flex-col justify-center items-center w-[100vw] h-[100vh]">
    <h1 class="text-5xl mb-5 dancing-script">Finbits</h1>
    <GoogleSignInButton
      @success="handleLoginSuccess"
      @error="handleLoginError"
    ></GoogleSignInButton>
  </div>
</template>
