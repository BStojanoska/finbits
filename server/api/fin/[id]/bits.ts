import { serverSupabaseClient } from "#supabase/server";
import { QueryData } from "@supabase/supabase-js";
import { Database } from "~/types/supabase";
import { format } from "date-fns";

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event);

  const bits = client
    .from("bits")
    .select("*, categories (name)")
    .eq("fin_id", event?.context?.params?.id || "")
    .order("created_at", { ascending: false });

  type BitsWithCategory = QueryData<typeof bits>;

  const { data, error } = await bits;

  const results: BitsWithCategory = data ?? [];

  if (error) {
    throw new Error(error.message);
  }

  const formattedByDate = formatByDate(results);
  const totals: { [key: string]: string } = {};
  Object.keys(formattedByDate).map((key) => {
    const total = formattedByDate[key].reduce((acc: number, bit: any) => {
      return acc + parseFloat(bit.amount);
    }, 0);

    totals[key] = new Intl.NumberFormat('de-De', {
      style: "decimal",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(total);
    return total;
  });

  return { status: 200, results: formattedByDate, totals: totals };
});

const formatByDate = <T>(bits: T) => {
  const obj: { [key: string]: any } = {};

  if (!bits || !(bits instanceof Array)) return obj;

  bits.forEach((bit: any) => {
    const formattedDate = format(bit.created_at, "dd/MM/yyyy").toString();
    if (!obj[formattedDate]) {
      obj[formattedDate] = [];
    }

    obj[formattedDate].push(bit);
  });

  return obj;
};
