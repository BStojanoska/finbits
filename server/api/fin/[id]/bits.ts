import { format } from "date-fns";
import { db } from '~/server/db';
import { eq, desc, and } from 'drizzle-orm';
import { bitsTable, categoriesTable, finsTable } from '~/server/db/schema';
import { withSession } from "supertokens-node/custom";
import { getUserUUID } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
  try {
    const request = await convertToRequest(event);
    return withSession(request, async (err, session) => {
      if (err) {
        throw createError({ statusCode: 500, statusMessage: err.message || "Internal server error" });
      }

      const supertokensId = session?.getUserId();
      if (!supertokensId) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
      }

      const userId = await getUserUUID(supertokensId);

      const finId = event?.context?.params?.id;
      if (!finId) {
        throw createError({ statusCode: 400, statusMessage: "Fin ID is required" });
      }

      // Verify the fin belongs to the user
      const finCheck = await db
        .select({ id: finsTable.id })
        .from(finsTable)
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .limit(1);

      if (finCheck.length === 0) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }

      // Get bits with category information
      const results = await db
        .select({
          // Explicitly list columns from bitsTable
          id: bitsTable.id,
          name: bitsTable.name,
          amount: bitsTable.amount,
          date: bitsTable.date,
          note: bitsTable.note,
          created_at: bitsTable.created_at,
          category_id: bitsTable.category_id,
          fin_id: bitsTable.fin_id,
          // Add the aliased category name
          category_name: categoriesTable.name,
        })
        .from(bitsTable)
        .leftJoin(categoriesTable, eq(bitsTable.category_id, categoriesTable.id))
        .where(eq(bitsTable.fin_id, finId))
        .orderBy(desc(bitsTable.created_at));

      const formattedByDate = formatByDate(results); // Use Drizzle results directly

      const totals: { [key: string]: string } = {};
      Object.keys(formattedByDate).map((key) => {
        const total = formattedByDate[key].reduce((acc: number, bit: any) => {
          return acc + parseFloat(bit.amount);
        }, 0);

        totals[key] = new Intl.NumberFormat('de-DE', {
          style: "decimal",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        }).format(total);
        return total;
      });

      return new Response(JSON.stringify({ 
        status: 200, 
        results: formattedByDate, 
        totals: totals 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  } catch (error: any) {
    console.error('Error fetching bits:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.message || "Error fetching bits" 
    });
  }
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
