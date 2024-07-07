import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  // Save the event data to the database
  const client = await serverSupabaseClient<Database>(event);
  console.log("client", client);
  const body = await readBody(event);
  const user = await client.auth.getUser();
  console.log("user", user);
  const results = await client
    .from("fins")
    .insert({ user_id: user.data.user?.id, name: body.name });

  console.log("results", results);
});
