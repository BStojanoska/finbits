import { db } from '~/server/db';
import { eq, and } from 'drizzle-orm';
import { bitsTable, categoriesTable, finsTable } from '~/server/db/schema';
import { v4 as uuidv4 } from 'uuid';
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

      const finId = event?.context?.params?.id;
      if (!finId) {
        throw createError({ statusCode: 400, statusMessage: "Fin ID is required" });
      }

      // First verify that the fin belongs to the user
      const finCheck = await db
        .select({ id: finsTable.id })
        .from(finsTable)
        .where(and(eq(finsTable.id, finId), eq(finsTable.user_id, userId)))
        .limit(1);

      if (finCheck.length === 0) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }

      // Determine Category ID
      categoryId = body.category_id; // Prioritize ID if sent from frontend

      if (!categoryId && body.category_name) {
        // If no ID, try to find or create by name
        const categoryName = body.category_name.trim();
        if (categoryName) {
          // Find category by name and user
          const categoryData = await db
            .select({ id: categoriesTable.id })
            .from(categoriesTable)
            .where(and(eq(categoriesTable.name, categoryName), eq(categoriesTable.user_id, userId)))
            .limit(1);

          if (categoryData.length > 0) {
            categoryId = categoryData[0].id;
          } else {
            // Insert category if it doesn't exist
            const newCategoryId = uuidv4();
            const newCatResult = await db
              .insert(categoriesTable)
              .values({
                id: newCategoryId,
                name: categoryName, // Use the trimmed name
                user_id: userId,
              })
              .returning({ id: categoriesTable.id });

            if (newCatResult.length > 0) {
              categoryId = newCatResult[0].id;
            } else {
              console.error("Failed to create category:", categoryName);
              // Don't throw error, proceed with categoryId = null
              categoryId = null;
            }
          }
        } else {
           categoryId = null; // Empty category name provided
        }
      } else if (!categoryId) {
         categoryId = null; // No category info provided
      }
      // Now categoryId is either the provided ID, the found/created ID, or null

      // Handle POST, PUT, DELETE based on method
      if (event.method === 'POST' || event.method === 'PUT') {
        // Determine Category ID (logic moved inside POST/PUT block)
        categoryId = body.category_id; // Prioritize ID if sent from frontend

        if (!categoryId && body.category_name) {
          // If no ID, try to find or create by name
          const categoryName = body.category_name.trim();
          if (categoryName) {
            // Find category by name and user
            const categoryData = await db
              .select({ id: categoriesTable.id })
              .from(categoriesTable)
              .where(and(eq(categoriesTable.name, categoryName), eq(categoriesTable.user_id, userId)))
              .limit(1);

            if (categoryData.length > 0) {
              categoryId = categoryData[0].id;
            } else {
              // Insert category if it doesn't exist
              const newCategoryId = uuidv4();
              const newCatResult = await db
                .insert(categoriesTable)
                .values({
                  id: newCategoryId,
                  name: categoryName, // Use the trimmed name
                  user_id: userId,
                })
                .returning({ id: categoriesTable.id });

              if (newCatResult.length > 0) {
                categoryId = newCatResult[0].id;
              } else {
                console.error("Failed to create category:", categoryName);
                categoryId = null;
              }
            }
          } else {
             categoryId = null; // Empty category name provided
          }
        } else if (!categoryId) {
           categoryId = null; // No category info provided
        }
        // Now categoryId is determined for POST/PUT

        if (event.method === 'PUT') {
           // Update existing bit
           if (!body.id) {
             throw createError({ statusCode: 400, statusMessage: "Missing bit ID for update" });
           }
           const updateResult = await db
             .update(bitsTable)
             .set({
               name: body.name,
               amount: String(body.amount),
               note: body.note,
               date: new Date(body.date),
               category_id: categoryId,
             })
             .where(and(eq(bitsTable.id, body.id), eq(bitsTable.fin_id, finId))) // Verify ownership via finId
             .returning({ id: bitsTable.id });

            if (updateResult.length === 0) {
              throw createError({ statusCode: 404, statusMessage: "Bit not found or update failed" });
            }

           return new Response(JSON.stringify({ message: "success" }), {
             status: 200,
             headers: { "Content-Type": "application/json" },
           });
         } else { // POST
           // Insert new bit
           const newBitId = uuidv4();
           const insertResult = await db
             .insert(bitsTable)
             .values({
               id: newBitId,
               name: body.name,
               fin_id: finId,
               amount: String(body.amount),
               note: body.note,
               date: new Date(body.date),
               category_id: categoryId,
             })
             .returning({ id: bitsTable.id });

            if (insertResult.length === 0) {
              throw createError({ statusCode: 500, statusMessage: "Failed to create bit" });
            }

           return new Response(JSON.stringify({ message: "success", id: insertResult[0].id }), {
             status: 201,
             headers: { "Content-Type": "application/json" },
           });
         }
      } else if (event.method === 'DELETE') {
        // Delete existing bit
        if (!body.id) {
          throw createError({ statusCode: 400, statusMessage: "Missing bit ID for delete" });
        }

        const deleteResult = await db
          .delete(bitsTable)
          .where(and(eq(bitsTable.id, body.id), eq(bitsTable.fin_id, finId))) // Verify ownership via finId
          .returning({ id: bitsTable.id });

        if (deleteResult.length === 0) {
          // Either bit not found OR it didn't belong to this fin (which is owned by user)
          throw createError({ statusCode: 404, statusMessage: "Bit not found or unauthorized" });
        }

        return new Response(JSON.stringify({ message: "success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } else {
         // Method Not Allowed
         throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
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
