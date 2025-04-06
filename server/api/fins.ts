import { withSession } from "supertokens-node/custom";
import { getUserUUID } from "~/server/utils/user";
import { db } from "~/server/db";
import { eq, or, sql } from "drizzle-orm";
import { finsTable, finSharesTable } from "~/server/db/schema";
import supertokens from 'supertokens-node';

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
      // Fetch user email as well
      const userInfo = await supertokens.getUser(supertokensId);
      if (!userInfo || !userInfo.emails || userInfo.emails.length === 0) {
          throw createError({ statusCode: 500, statusMessage: "Could not retrieve user email" });
      }
      const userEmail = userInfo.emails[0].toLowerCase();

      // Query for fins owned by the user OR shared with the user's email
      const results = await db
        .select({
          id: finsTable.id,
          name: finsTable.name,
          total_amount: finsTable.total_amount,
          date_from: finsTable.date_from,
          date_to: finsTable.date_to,
          user_id: finsTable.user_id,
          is_owner: sql<boolean>`${finsTable.user_id} = ${userId}`.as('is_owner')
        })
        .from(finsTable)
        .leftJoin(finSharesTable, eq(finsTable.id, finSharesTable.fin_id))
        .where(
          or(
            eq(finsTable.user_id, userId),
            eq(finSharesTable.shared_with_user_email, userEmail)
          )
        )
        .groupBy(
            finsTable.id,
            finsTable.name,
            finsTable.total_amount,
            finsTable.date_from,
            finsTable.date_to,
            finsTable.user_id
         );

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
