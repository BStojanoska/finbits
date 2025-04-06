import { format } from "date-fns";
import { db } from '~/server/db';
import { eq, desc, and } from 'drizzle-orm';
import { bitsTable, categoriesTable, finsTable, finSharesTable } from '~/server/db/schema'; // Added finSharesTable
import { withSession } from "supertokens-node/custom";
import { getUserDetails } from "~/server/utils/user"; // Changed to getUserDetails

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

      const userDetails = await getUserDetails(supertokensId); // Get user ID and email
      const userId = userDetails.id;
      const userEmail = userDetails.email;

      const finId = event?.context?.params?.id;
      if (!finId) {
        throw createError({ statusCode: 400, statusMessage: "Fin ID is required" });
      }

      // --- Authorization Check ---
      // 1. Check if the user is the owner
      const ownerCheck = await db
        .select({ id: finsTable.id })
        .from(finsTable)
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .limit(1);

      let isAuthorized = ownerCheck.length > 0;

      // 2. If not the owner, check if the fin is shared with the user
      if (!isAuthorized) {
        const shareCheck = await db
          .select({ fin_id: finSharesTable.fin_id })
          .from(finSharesTable)
          .where(and(
            eq(finSharesTable.fin_id, finId),
            eq(finSharesTable.shared_with_user_email, userEmail)
          ))
          .limit(1);
        
        isAuthorized = shareCheck.length > 0;
      }

      // 3. If neither check passed, deny access
      if (!isAuthorized) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }
      // --- End Authorization Check ---

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
    // Use the actual expense date (bit.date) for grouping
    const formattedDate = format(new Date(bit.date), "dd/MM/yyyy").toString();
    if (!obj[formattedDate]) {
      obj[formattedDate] = [];
    }

    obj[formattedDate].push(bit);
  });

  return obj;
};
