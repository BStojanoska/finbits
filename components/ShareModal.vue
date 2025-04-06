<template>
  <Dialog
    v-bind:visible="props.openDialog"
    @update:visible="updateVisible"
    header="Share Fin Record"
    modal
    class="w-[90vw] md:w-[50wv] lg:w-[30vw]"
  >
    <form
      ref="form"
      class="flex flex-col gap-3 justify-between items-center pb-5"
      @submit.prevent="shareFin"
    >
      <InputText v-model="email" type="email" placeholder="Recipient's Email" class="w-full"></InputText>

      <div class="flex justify-end gap-2 w-full mt-4">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            @click="updateVisible(false)"
          ></Button>
          <Button
            type="submit"
            label="Share"
            :loading="sharing"
          ></Button>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const form = ref();
const sharing = ref(false);
const email = ref('');
const toast = useToast(); // Assuming useToast is globally available or imported

const emit = defineEmits(["update:openDialog"]);

const props = withDefaults(
  defineProps<{
    openDialog: boolean;
    finId: string | null; // Add finId prop
  }>(),
  {
    openDialog: false,
    finId: null, // Default finId to null
    // finId: null,
  }
);

const updateVisible = (value: boolean) => {
  if (!value) {
    resetForm();
  }
  emit("update:openDialog", value);
};

const resetForm = () => {
  email.value = '';
  sharing.value = false; // Reset loading state
};

const shareFin = async () => {
  if (!email.value) {
    toast.add({ summary: 'Email required', detail: 'Please enter an email address.', severity: 'warn', life: 3000 });
    return;
  }
  // Add check for finId
  if (!props.finId) {
    toast.add({ summary: 'Error', detail: 'Fin ID is missing.', severity: 'error', life: 3000 });
    return;
  }

  sharing.value = true;

  try {
    // Call the correct endpoint and pass data
    const response = await $fetch<{ message: string, detail?: string }>('/api/share', {
      method: 'POST',
      body: {
        email: email.value.trim(), // Trim email
        finId: props.finId
      }
    });
    // Use response detail if available
    toast.add({ summary: 'Shared Successfully', detail: response.detail || `Shared with ${email.value.trim()}`, severity: 'success', life: 3000 });
    updateVisible(false); // Close dialog on success

  } catch (error: any) {
    console.error('Sharing failed:', error);
    // Attempt to parse H3 error structure for better messages
    const errorMessage = error.data?.message || error.data?.statusMessage || error.message || 'An unknown error occurred.';
    toast.add({ summary: 'Sharing Failed', detail: errorMessage, severity: 'error', life: 5000 });
  } finally {
    sharing.value = false;
  }
};

</script>