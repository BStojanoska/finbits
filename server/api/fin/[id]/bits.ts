import { serverSupabaseClient } from "#supabase/server";
import { QueryData } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);

  const bits = client
    .from("bits")
    .select("*, categories (name)")
    .eq("fin_id", event?.context?.params?.id || "")
    .order("created_at", { ascending: false });

  type BitWithCategory = QueryData<typeof bits>;

  const { data, error } = await bits;

  const results: BitWithCategory = data ?? [];

  if (error) {
    throw new Error(error.message);
  }

  return { status: 200, results };
});
