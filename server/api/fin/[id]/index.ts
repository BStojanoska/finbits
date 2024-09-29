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
  } else if (event.method === "POST") {
    const body = await readBody(event);
    const user = await client.auth.getUser();

    const { data, error } = await client
      .from("fins")
      .insert({ user_id: user.data.user?.id, name: body.name })
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return { status: 200, body: { message: "success", id: data[0].id } };
  } else if (event.method === "DELETE") {
    const { error } = await client
      .from("fins")
      .delete()
      .eq("id", event?.context?.params?.id || "");

    if (error) {
      throw new Error(error.message);
    }

    return { status: 204, body: { message: "success" } };
  } else if (event.method === "PUT") {
    const body = await readBody(event);

    const { data, error } = await client
      .from("fins")
      .update({ name: body.name })
      .eq("id", event?.context?.params?.id || "")
      .select("*");

    if (error) {
      throw new Error(error.message);
    }

    return { status: 200, body: { message: "success" } };
  }
});
