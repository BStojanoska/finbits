import { withSession } from "supertokens-node/custom";
import { db } from '~/server/db';
import { eq, desc } from 'drizzle-orm';
import { finsTable } from '~/server/db/schema';
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

      const results = await db
        .select({
          id: finsTable.id,
          name: finsTable.name,
          created_at: finsTable.created_at,
        })
        .from(finsTable)
        .where(eq(finsTable.user_id, userId))
        .orderBy(desc(finsTable.created_at));

      return new Response(JSON.stringify(results), {
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
