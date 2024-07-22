import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  // Save the event data to the database
  const client = await serverSupabaseClient<Database>(event);
  const user = await client.auth.getUser();

  const results = await client
    .from("categories")
    .select("id, name")
    .eq("user_id", user?.data?.user?.id || "")
    .order("created_at", { ascending: false });

  if (results.data) {
    return { status: 200, body: results.data };
  } else {
    throw new Error("Error fetching data!");
  }
});
