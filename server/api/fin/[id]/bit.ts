import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  // Save the event data to the database
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody(event);
  const user = await client.auth.getUser();
  let categoryId = null;

  const { data: categoryData, error: categoryError } = await client
    .from("categories")
    .select("id")
    .eq("name", body.category)
    .limit(1);

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  try {
    if (categoryData.length === 0) {
      // insert category
      const { data: newCat, error } = await client
        .from("categories")
        .insert({ name: body.category, user_id: user.data.user?.id })
        .select("*");

      if (newCat && newCat?.length > 0) {
        categoryId = newCat[0].id;
      }
    } else {
      categoryId = categoryData[0].id;
    }
  } catch (error: any) {
    throw new Error(error.message);
  }

  const { data, error } = await client.from("bits").insert({
    name: body.name,
    fin_id: Number(event?.context?.params?.id),
    amount: body.amount,
    note: body.note,
    category_id: categoryId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { status: 200, body: { message: "success" } };
});
