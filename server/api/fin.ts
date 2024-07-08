import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  // Save the event data to the database
  const client = await serverSupabaseClient<Database>(event);
  const body = await readBody(event);
  const user = await client.auth.getUser();

  await client
    .from("fins")
    .insert({ user_id: user.data.user?.id, name: body.name });

  return { status: 200, body: { message: "success" } };
});
