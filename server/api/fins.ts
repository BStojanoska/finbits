import { withSession } from "supertokens-node/custom";
import { getUserUUID } from "~/server/utils/user";

export default defineEventHandler(async (event) => {
  try {
    const request = await convertToRequest(event);
    // Store the result of withSession
    const response = await withSession(request, async (err, session) => {
      if (err) {
        throw createError({ statusCode: 500, statusMessage: err.message || "Internal server error" });
      }

      const supertokensId = session?.getUserId();

      if (!supertokensId) {
        throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
      }

      const userId = await getUserUUID(supertokensId);

      const results = await query(
        'SELECT id, name, created_at FROM fins WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return new Response(JSON.stringify(results.rows), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    return response;
  } catch (error: any) {
    console.error('Error fetching fins:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.message || "Error fetching data!" 
    });
  }
});
