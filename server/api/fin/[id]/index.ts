import { db } from '~/server/db';
import { eq, and } from 'drizzle-orm';
import { finsTable } from '~/server/db/schema';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator
import { withSession } from 'supertokens-node/custom';
import { getUserUUID } from '~/server/utils/user';

export default defineEventHandler(async (event) => {
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

    if (event.method === "GET") {
      const result = await db
        .select({ name: finsTable.name })
        .from(finsTable)
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .limit(1);

      if (result.length === 0) {
        throw createError({ statusCode: 404, statusMessage: "Fin not found" });
      }

      return new Response(JSON.stringify(result[0]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "POST") {
      const body = await readBody(event);

      // Note: This POST ignores the finId from the route and creates a new fin.
      // Generate a new ID for the fin
      const newFinId = uuidv4();

      // Ensure required 'name' field is present in the body
      if (!body.name) {
        throw createError({ statusCode: 400, statusMessage: "Missing required field (name) in request body" });
      }

      const insertResult = await db
        .insert(finsTable)
        .values({
          id: newFinId, // Provide the generated ID
          user_id: userId,
          name: body.name,
          date_from: new Date(), // Default to current timestamp
          date_to: new Date(),     // Default to current timestamp
          total_amount: '0.00', // Default to 0.00
        })
        .returning({ id: finsTable.id });

      if (insertResult.length === 0) {
         throw createError({ statusCode: 500, statusMessage: "Failed to create fin" });
      }

      return new Response(JSON.stringify({ message: "success", id: insertResult[0].id }), {
        status: 201, // Use 201 Created for successful resource creation
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "DELETE") {
      // Verification is implicitly handled by the WHERE clause in the delete operation.
      // If the delete operation affects 0 rows, it means the fin didn't exist or didn't belong to the user.

      const deleteResult = await db
        .delete(finsTable)
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .returning({ id: finsTable.id }); // Returning ID to check if deletion happened

      // Check if any row was actually deleted
       if (deleteResult.length === 0) {
         throw createError({ statusCode: 404, statusMessage: "Fin not found or unauthorized" });
       }

      // Return 200 with success message
      return new Response(JSON.stringify({ message: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "PUT") {
      const body = await readBody(event);

      const updateResult = await db
        .update(finsTable)
        .set({ name: body.name })
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .returning({ id: finsTable.id }); // Returning ID to check if update happened

      // Check if any row was actually updated
      if (updateResult.length === 0) {
        throw createError({ statusCode: 404, statusMessage: "Fin not found or unauthorized" });
      }

      return new Response(JSON.stringify({ message: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  });
});
