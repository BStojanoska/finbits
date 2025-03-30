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
      const body = await readBody(event);
      let categoryId = null;

      // First verify that the fin belongs to the user
      const finCheck = await query(
        "SELECT id FROM fins WHERE id = $1 AND user_id = $2",
        [event?.context?.params?.id, userId]
      );

      if (finCheck.rows.length === 0) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }

      const categoryData = await query(
        "SELECT id FROM categories WHERE name = $1 AND user_id = $2 LIMIT 1",
        [body.category, userId]
      );

      try {
        if (categoryData.rows.length === 0) {
          // insert category
          const newCat = await query(
            "INSERT INTO categories (name, user_id) VALUES ($1, $2) RETURNING id",
            [body.category, userId]
          );

          if (newCat && newCat?.rows?.length > 0) {
            categoryId = newCat.rows[0].id;
          }
        } else {
          categoryId = categoryData.rows[0].id;
        }

        if (body.id) {
          // For update, verify the bit belongs to a fin owned by the user
          await query(
            `UPDATE bits SET name = $1, amount = $2, note = $3, created_at = $4, category_id = $5 
             WHERE id = $6 AND fin_id IN (SELECT id FROM fins WHERE user_id = $7)`,
            [body.name, body.amount, body.note, body.date, categoryId, body.id, userId]
          );

          return new Response(JSON.stringify({ message: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
          await query(
            "INSERT INTO bits (name, fin_id, amount, note, created_at, category_id) VALUES ($1, $2, $3, $4, $5, $6)",
            [body.name, event?.context?.params?.id, body.amount, body.note, body.date, categoryId]
          );

          return new Response(JSON.stringify({ message: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (error: any) {
        console.error('Database error:', error);
        throw createError({ 
          statusCode: 500, 
          statusMessage: error.message || "Database error" 
        });
      }
    });
  } catch (error: any) {
    console.error('Error in bit endpoint:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.message || "Internal server error" 
    });
  }
});
