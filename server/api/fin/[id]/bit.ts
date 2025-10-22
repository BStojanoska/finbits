import { db } from '~/server/db';
import { eq, and, or } from 'drizzle-orm';
import { bitsTable, categoriesTable, finSharesTable, finsTable } from '~/server/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { withSession } from "supertokens-node/custom";
import { getUserUUID } from "~/server/utils/user";

// Helper function to update fin totals and dates
// Let TypeScript infer the type of 'tx' from its usage within db.transaction
async function updateFinTotalsAndDates(finId: string, tx: any) {
  // Get all bits for the fin to calculate totals and dates
  const allBits = await tx
    .select({
      amount: bitsTable.amount,
      date: bitsTable.date,
    })
    .from(bitsTable)
    .where(eq(bitsTable.fin_id, finId));

  let totalAmount = '0.00';
  let dateFrom: Date | null = null;
  let dateTo: Date | null = null;

  if (allBits.length > 0) {
    // Calculate total amount
    const calculatedTotal = allBits.reduce((acc: number, bit: { amount: string | null, date: Date }) => acc + parseFloat(bit.amount || '0'), 0);
    totalAmount = calculatedTotal.toFixed(2); // Format to 2 decimal places

    // Find min and max dates
    const dates = allBits.map((bit: { amount: string | null, date: Date }) => bit.date.getTime()); // Get timestamps
    dateFrom = new Date(Math.min(...dates));
    dateTo = new Date(Math.max(...dates));
  } else {
    // If no bits, set default values to satisfy NOT NULL constraints
    // Use null if the schema allows, otherwise use defaults like Date()
    // Assuming schema requires NOT NULL based on previous context
    const now = new Date();
    dateFrom = now;
    dateTo = now;
    totalAmount = '0.00';
  }

  // Update the fins table
  await tx
    .update(finsTable)
    .set({
      total_amount: totalAmount,
      date_from: dateFrom,
      date_to: dateTo,
    })
    .where(eq(finsTable.id, finId));
}


export default defineEventHandler(async (event) => {
  try { // Outer try for the whole handler
    const request = await convertToRequest(event);

    // Wrap the entire session logic in a transaction
    return await db.transaction(async (tx) => {
      return await withSession(request, async (err, session) => {
        if (err) {
          // Handle session error before proceeding
          console.error('Session error:', err);
          throw createError({ statusCode: 500, statusMessage: err.message || "Session error" });
        }

        const supertokensId = session?.getUserId();
        if (!supertokensId) {
          throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
        }

        const userId = await getUserUUID(supertokensId);
        const userEmail = await getUserDetails(supertokensId).then(details => details.email);

        const finId = event?.context?.params?.id;
        if (!finId) {
          throw createError({ statusCode: 400, statusMessage: "Fin ID is required" });
        }

        // First verify that the fin belongs to the user or is shared with them
        const finCheck = await tx
          .select({ id: finsTable.id })
          .from(finsTable)
          .leftJoin(finSharesTable, eq(finsTable.id, finSharesTable.fin_id))
          .where(
            and(
            eq(finsTable.id, finId),
              or(
                eq(finsTable.user_id, userId), // User owns the fin
                eq(finSharesTable.shared_with_user_email, userEmail) // User has access through sharing
              )
            )
          )
          .limit(1);

        if (finCheck.length === 0) {
          throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
        }

        // Read body only once, needed for all methods (POST, PUT, DELETE)
        const body = await readBody(event);
        let categoryId = null; // Initialize categoryId

        // Handle POST, PUT, DELETE based on method
        if (event.method === 'POST' || event.method === 'PUT') {
          // Determine Category ID only for POST/PUT
          categoryId = body.category_id; // Prioritize ID if sent from frontend

          if (!categoryId && body.category_name) {
            const categoryName = body.category_name.trim();
            if (categoryName) {
              const categoryData = await tx
                .select({ id: categoriesTable.id })
                .from(categoriesTable)
                .where(and(eq(categoriesTable.name, categoryName), eq(categoriesTable.user_id, userId)))
                .limit(1);

              if (categoryData.length > 0) {
                categoryId = categoryData[0].id;
              } else {
                const newCategoryId = uuidv4();
                const newCatResult = await tx
                  .insert(categoriesTable)
                  .values({ id: newCategoryId, name: categoryName, user_id: userId })
                  .returning({ id: categoriesTable.id });

                if (newCatResult.length > 0) {
                  categoryId = newCatResult[0].id;
                } else {
                  console.error("Failed to create category:", categoryName);
                  categoryId = null; // Proceed without category if creation fails
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
             const updateResult = await tx
               .update(bitsTable)
               .set({
                 name: body.name,
                 amount: String(body.amount),
                 note: body.note,
                 // Parse ISO string, format to YYYY-MM-DD to store correct date
                 date: new Date(body.date), // Parse ISO string back to Date object
                 category_id: categoryId,
               })
               .where(and(eq(bitsTable.id, body.id), eq(bitsTable.fin_id, finId)))
               .returning({ id: bitsTable.id });

              if (updateResult.length === 0) {
                throw createError({ statusCode: 404, statusMessage: "Bit not found or update failed" });
              }
              // Update fin totals after successful bit update
              await updateFinTotalsAndDates(finId, tx);

             return new Response(JSON.stringify({ message: "success" }), {
               status: 200,
               headers: { "Content-Type": "application/json" },
             });
           } else { // POST
             // Insert new bit
             const newBitId = uuidv4();
             const insertResult = await tx
               .insert(bitsTable)
               .values({
                 id: newBitId,
                 name: body.name,
                 fin_id: finId,
                 amount: String(body.amount),
                 note: body.note,
                 // Parse ISO string, format to YYYY-MM-DD to store correct date
                 date: new Date(body.date), // Parse ISO string back to Date object
                 category_id: categoryId,
               })
               .returning({ id: bitsTable.id });

              if (insertResult.length === 0) {
                throw createError({ statusCode: 500, statusMessage: "Failed to create bit" });
              }
              // Update fin totals after successful bit insert
              await updateFinTotalsAndDates(finId, tx);

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

          const deleteResult = await tx
            .delete(bitsTable)
            .where(and(eq(bitsTable.id, body.id), eq(bitsTable.fin_id, finId)))
            .returning({ id: bitsTable.id });

          if (deleteResult.length === 0) {
            throw createError({ statusCode: 404, statusMessage: "Bit not found or unauthorized" });
          }
          // Update fin totals after successful bit delete
          await updateFinTotalsAndDates(finId, tx);

          return new Response(JSON.stringify({ message: "success" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } else {
           // Method Not Allowed should be inside the session callback
           throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
        }
      }); // End of withSession callback
    }); // End of db.transaction
  } catch (error: any) { // Outer catch for any error
    console.error('Error in bit endpoint:', error);
    // Use the error's statusCode and message if available, otherwise default
    const statusCode = error.statusCode || 500;
    const statusMessage = error.statusMessage || error.message || "Internal server error";
    // Throw a standard error that Nuxt can handle
    throw createError({ statusCode, statusMessage });
  }
});
