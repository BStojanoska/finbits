import { db } from '~/server/db';
import { eq, desc } from 'drizzle-orm';
import { categoriesTable } from '~/server/db/schema';
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

      const results = await db
        .select({
          id: categoriesTable.id,
          name: categoriesTable.name,
        })
        .from(categoriesTable)
        .where(eq(categoriesTable.user_id, userId))
        .orderBy(desc(categoriesTable.created_at));

      return new Response(JSON.stringify({
        status: 200,
        body: results
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.message || "Error fetching categories" 
    });
  }
});
