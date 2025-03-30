import { format } from "date-fns";
import { query } from '~/server/utils/db';
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

      // Verify the fin belongs to the user
      const finCheck = await query(
        "SELECT id FROM fins WHERE id = $1 AND user_id = $2",
        [event?.context?.params?.id, userId]
      );

      if (finCheck.rows.length === 0) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }

      // Get bits with category information
      const results = await query(
        `SELECT b.*, c.name as category_name 
         FROM bits b 
         LEFT JOIN categories c ON b.category_id = c.id 
         WHERE b.fin_id = $1 
         ORDER BY b.created_at DESC`,
        [event?.context?.params?.id]
      );

      const formattedByDate = formatByDate(results.rows);

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
