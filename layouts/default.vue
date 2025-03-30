<template>
  <div class="w-full h-full flex flex-row">
    <div class="flex flex-col w-full mx-10 mt-5 mb-3">
      <div class="flex flex-row w-full justify-between items-center">
        <div
          class="text-5xl font-bold p-3 cursor-pointer dancing-script"
          @click="router.push({ path: '/' })"
        >
          FinBits
        </div>

        <div v-if="!isLoading && userId" class="flex flex-row items-center border border-gray-500 rounded-full p-4 cursor-pointer" @click="openDropdown = !openDropdown">
          <font-awesome-icon icon="fa-solid fa-user" />
        </div>
        <div v-if="openDropdown" class="absolute top-[82px] right-2 bg-white text-black shadow-lg rounded-lg p-4">
          <div v-if="!isSigningOut" class="flex flex-row items-center cursor-pointer" @click="signOut">
            <font-awesome-icon icon="fa-solid fa-sign-out-alt" />
            <span class="ml-2">Sign out</span>
          </div>
          <div v-else class="ml-2">
            <font-awesome-icon icon="fa-solid fa-spinner" class="animate-spin" />
          </div>
        </div>
      </div>
      <div class="px-3 py-10">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { initSuperTokensWebJS } from "../config/frontend"
import Session from 'supertokens-web-js/recipe/session';

const router = useRouter();
const openDropdown = ref(false);
const userId = ref('');
const isLoading = ref(true);
const isSigningOut = ref(false);

initSuperTokensWebJS();
onMounted(async () => {

  try {
    const hasSession = await Session.doesSessionExist();
    if (hasSession) {
      userId.value = await Session.getUserId();
    }
  } catch (error) {
    console.error('Error getting user session:', error);
  } finally {
    isLoading.value = false;
  }
});

const signOut = async () => {
  isSigningOut.value = true;
  await Session.signOut();
  window.location.reload();
}
</script>
