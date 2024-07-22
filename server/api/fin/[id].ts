import { serverSupabaseClient } from "#supabase/server";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  // Save the event data to the database
  const client = await serverSupabaseClient<Database>(event);

  if (event.method === "GET") {
    const { data, error } = await client
      .from("fins")
      .select("name")
      .eq("id", event?.context?.params?.id || "")
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return { status: 200, body: data[0] };
  } else {
    const body = await readBody(event);
    const user = await client.auth.getUser();

    const { data, error } = await client
      .from("fins")
      .insert({ user_id: user.data.user?.id, name: body.name });

    if (error) {
      throw new Error(error.message);
    }

    return { status: 200, body: { message: "success" } };
  }
});
