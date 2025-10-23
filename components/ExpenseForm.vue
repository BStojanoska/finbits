<template>
  <Dialog
    v-bind:visible="props.openDialog"
    @update:visible="updateVisible"
    :header="`${selectedBit?.id ? 'Edit' : 'Add'} expense`"
    modal
    class="w-[100vw] md:w-[75wv] lg:w-[30vw]"
  >
    <form
      ref="form"
      class="flex flex-col gap-3 justify-between items-center pb-5"
    >
      <InputText v-model="name" type="text" placeholder="What?"></InputText>
      <InputNumber
        v-model="amount"
        :minFractionDigits="2"
        :maxFractionDigits="2"
        :min="0"
        locale="de-DE"
        type="number"
        placeholder="How much?"
      ></InputNumber>
      <DatePicker v-model="date" dateFormat="dd/mm/yy" />
      <AutoComplete
        v-model="category"
        :suggestions="filteredCategories"
        placeholder="Category?"
        optionLabel="name"
        @complete="search"
      />
      <InputText v-model="note" type="text" placeholder="Note"></InputText>

      <div class="flex justify-between w-full">
         <Button
           v-if="props.selectedBit?.id"
           type="button"
           label="Delete"
           severity="danger"
           icon="pi pi-trash"
           outlined
           :loading="deleting"
           @click="confirmDelete($event)"
         ></Button>
         <div v-else></div> <!-- Placeholder to keep alignment -->

         <div class="flex justify-end gap-2">
             <Button
               type="button"
               label="Cancel"
               severity="secondary"
               @click="updateVisible(false)"
             ></Button>
             <Button
               type="button"
               label="Save"
               :loading="creating"
               @click="createExpense"
             ></Button>
         </div>
      </div>
      <ConfirmPopup></ConfirmPopup>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
// No date-fns format needed here anymore
import InputNumber from "primevue/inputnumber";
import ConfirmPopup from 'primevue/confirmpopup';
import { useConfirm } from "primevue/useconfirm";

// Add proper type definitions
interface Category {
  name: string;
  value: string;
}

interface BitItem {
  id?: string;
  name: string;
  amount: string;
  date: string;
  note: string;
  category_id?: string;
  category_name?: string;
}

interface ApiResponse {
  message: string;
  id?: string;
}

// Fix ref types
const filteredCategories = ref<Category[]>([]);
const categories = ref<Category[]>([]);
const category = ref<Category | string | null>(null);

const form = ref();
const creating = ref(false);
const deleting = ref(false);
const toast = useToast();
const confirm = useConfirm();
const name = ref("");
const amount = ref(0);
const date = ref(new Date());
const note = ref("");
const route = useRoute();
const emit = defineEmits(["update:openDialog", "update:selectedBit"]);

const props = withDefaults(
  defineProps<{
    openDialog: boolean;
    refreshItems: () => void;
    selectedBit: BitItem | null;
  }>(),
  {
    openDialog: false,
    refreshItems: () => {},
    selectedBit: null,
  }
);

const fetchCategories = async () => {
  try {
    const response = await $fetch<{ body: Category[] } | Category[]>("/api/categories", {
      method: "GET",
    });
    
    const categoryList = (response as any)?.body || response;
    if (Array.isArray(categoryList)) {
      categories.value = categoryList.map((cat: any) => ({
        name: cat.name,
        value: cat.id,
      }));
      filteredCategories.value = categories.value;
    } else {
      console.error("Unexpected category response format:", response);
      categories.value = [];
      filteredCategories.value = [];
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    toast.add({
      summary: "Error fetching categories",
      severity: "error",
      life: 3000,
    });
    categories.value = [];
    filteredCategories.value = [];
  }
};

onMounted(fetchCategories);

// Fix search function
const search = (event: { query: string }) => {
  setTimeout(() => {
    if (!event.query.trim().length) {
      filteredCategories.value = [...categories.value];
    } else {
      filteredCategories.value = categories.value.filter((cat: Category) => {
        return cat.name.toLowerCase().startsWith(event.query.toLowerCase());
      });
    }
  }, 250);
};

const updateVisible = (value: boolean) => {
  if (!value) {
    resetForm();
  }
  emit("update:openDialog", value);
};

const resetForm = () => {
  name.value = "";
  amount.value = 0;
  date.value = new Date();
  note.value = "";
  category.value = "";
  filteredCategories.value = categories.value;
  emit("update:selectedBit", null);
};

const createExpense = async (e: Event) => {
  e.preventDefault();
  creating.value = true;

  const payload = {
    id: props.selectedBit?.id || null,
    name: name.value.trim(),
    date: date.value.toDateString(),
    amount: amount.value.toString().trim(),
    note: note.value.trim(),
    category_id: (category.value as Category)?.value || null,
    category_name: (category.value as Category)?.name
      ? (category.value as Category).name.trim().toLowerCase()
      : typeof category.value === 'string' ? category.value.trim().toLowerCase() : null,
  };

  let method: "POST" | "PUT" = "POST";
  if (props.selectedBit?.id) {
    method = "PUT";
  }

  try {
    const response = await $fetch<ApiResponse>(`/api/fin/${route?.params?.id}/bit`, {
      method,
      headers: useRequestHeaders(["cookie"]),
      body: payload,
    });

    if (!response?.message || response.message !== "success") {
      throw new Error("Error adding expense...");
    }

    props.refreshItems();
    await fetchCategories();
    resetForm();

    toast.add({
      summary: `Expense ${props.selectedBit?.id ? "edited" : "added"} successfully!`,
      severity: "success",
      life: 5000,
    });
    
    emit("update:openDialog", false);
  } catch (error: any) {
    console.error('Error details:', error);
    toast.add({
      summary: `There was an error ${props.selectedBit?.id ? "updating" : "adding"} the expense`,
      detail: error.message || "Unknown error",
      severity: "error",
      life: 5000,
    });
  } finally {
    creating.value = false;
  }
};

watch(
  () => props.selectedBit,
  (value) => {
    if (value) {
      editBit(value);
    }
  }
);

// Fix editBit function
const editBit = async (item: BitItem) => {
  if (!categories.value || categories.value.length === 0) {
    await fetchCategories();
  }
  
  const cat = categories.value?.find((c: Category) => c.value === item.category_id);

  name.value = item.name;
  amount.value = parseFloat(item.amount);
  date.value = props.selectedBit?.id ? new Date(item.date) : new Date();
  note.value = item.note;
  
  if (cat) {
    category.value = cat;
  } else if (item.category_name) {
    category.value = {
      name: item.category_name,
      value: item.category_id || '',
    };
  } else {
    category.value = null;
  }
  
  emit("update:openDialog", true);
};

const confirmDelete = (event: any) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Do you want to delete this expense?',
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-danger p-button-sm',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => {
      deleteExpense();
    },
    reject: () => {
      // Optional: Handle rejection
    }
  });
};

const deleteExpense = async () => {
  if (!props.selectedBit?.id) return;

  deleting.value = true;
  try {
    const response = await $fetch<ApiResponse>(`/api/fin/${route?.params?.id}/bit`, {
      method: 'DELETE',
      headers: useRequestHeaders(['cookie']),
      body: { id: props.selectedBit.id },
    });

    if (!response?.message || response.message !== "success") {
      throw new Error('Failed to delete expense');
    }

    toast.add({
      summary: 'Expense Deleted',
      detail: 'The expense has been successfully deleted.',
      severity: 'success',
      life: 3000,
    });

    props.refreshItems();
    emit('update:openDialog', false);
    resetForm();

  } catch (error: any) {
    console.error('Error deleting expense:', error);
    toast.add({
      summary: 'Deletion Error',
      detail: error.message || 'An error occurred while deleting the expense.',
      severity: 'error',
      life: 5000,
    });
  } finally {
    deleting.value = false;
  }
}; // End of deleteExpense
</script>
