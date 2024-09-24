<template>
  <Dialog
    v-bind:visible="props.openDialog"
    @update:visible="emit('update:openDialog', $event)"
    :header="`${selectedBit?.id ? 'Edit' : 'Add'} expense`"
    modal
    class="w-[100vw] md:w-[75wv] lg:w-[30vw]"
  >
    <form
      ref="form"
      class="flex flex-col gap-3 justify-between items-center pb-5"
    >
      <InputText v-model="name" type="text" placeholder="What?"></InputText>
      <InputText
        v-model="amount"
        type="number"
        placeholder="How much?"
      ></InputText>
      <DatePicker v-model="date" dateFormat="dd/mm/yy" />
      <AutoComplete
        v-model="category"
        :suggestions="filteredCategories"
        placeholder="Category?"
        optionLabel="name"
        @complete="search"
      />
      <InputText v-model="note" type="text" placeholder="Note"></InputText>

      <div class="flex justify-end gap-2">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          @click="
            emit('update:openDialog', false);
            resetForm();
          "
        ></Button>
        <Button
          type="button"
          label="Save"
          :loading="creating"
          @click="createExpense"
        ></Button>
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
const form = ref();
const creating = ref(false);
const toast = useToast();
const filteredCategories = ref();
const name = ref("");
const amount = ref("");
const date = ref(new Date());
const note = ref("");
const category = ref();
const categories = ref();
const route = useRoute();
const emit = defineEmits(["update:openDialog"]);

const props = withDefaults(
  defineProps<{
    openDialog: boolean;
    refreshItems: () => void;
    selectedBit: any;
  }>(),
  {
    openDialog: false,
    refreshItems: () => {},
    selectedBit: null,
  }
);

onMounted(async () => {
  const response = await $fetch("/api/categories", {
    method: "GET",
  });

  if (response.status === 200) {
    categories.value = response.body.map((cat: any) => {
      return { name: cat.name, value: cat.id };
    });
    filteredCategories.value = categories.value;
  }
});

const search = (event: any) => {
  setTimeout(() => {
    if (!event.query.trim().length) {
      filteredCategories.value = [...categories.value];
    } else {
      filteredCategories.value = categories.value.filter((cat: any) => {
        return cat.name.toLowerCase().startsWith(event.query.toLowerCase());
      });
    }
  }, 250);
};

const resetForm = () => {
  name.value = "";
  amount.value = "";
  date.value = new Date();
  note.value = "";
  category.value = "";
  filteredCategories.value = categories.value;
};

const createExpense = async (e: Event) => {
  e.preventDefault();
  creating.value = true;

  console.log('category', category.value);
  const payload = {
    id: props.selectedBit?.id || null,
    name: name.value.trim(),
    amount: amount.value.toString().trim(),
    note: note.value.trim(),
    category: category.value?.name ? category.value.name.trim() : category.value.trim(),
  };

  let method = "POST" as "POST" | "PUT";
  if (props.selectedBit?.id) {
    method = "PUT";
  }

  try {
    const response = await $fetch(`/api/fin/${route?.params?.id}/bit`, {
      method,
      headers: useRequestHeaders(["cookie"]),
      body: JSON.stringify(payload),
    });

    if (response.status !== 200) {
      throw new Error("Error adding expense...");
    }

    resetForm();
    props.refreshItems();

    toast.add({
      summary: `Expense ${
        props.selectedBit?.id ? "edited" : "added"
      } successfully!`,
      severity: "success",
    });
  } catch (e) {
    toast.add({
      summary:
        `There was an error ${
          props.selectedBit?.id ? "updating" : "adding"
        } the expense...` + e,
      severity: "error",
    });
  } finally {
    creating.value = false;
    emit("update:openDialog", false);
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

const editBit = (item: any) => {
  const cat = categories.value.find((c: any) => c.id === item.category);

  name.value = item.name;
  amount.value = item.amount;
  date.value = props.selectedBit?.id ? new Date(item.created_at) : new Date();
  note.value = item.note;
  category.value = cat.name;
  emit("update:openDialog", true);
};
</script>
