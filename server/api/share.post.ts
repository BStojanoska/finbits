import { defineEventHandler, readBody, createError, H3Event } from 'h3';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { finsTable, finSharesTable } from '../db/schema';
import { withSession } from 'supertokens-node/custom';
import { getUserUUID } from '../utils/user';
import supertokens from 'supertokens-node';

// Define the expected structure of the request body
interface ShareRequestBody {
  finId: string;
  email: string;
}

export default defineEventHandler(async (event: H3Event) => {
  const request = await convertToRequest(event);

  return withSession(request, async (err, session) => {
    if (err) {
      console.error("Session error:", err);
      throw createError({ statusCode: 500, statusMessage: err.message || "Session error" });
    }
    if (!session) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized - No session" });
    }

    const supertokensId = session.getUserId();
    if (!supertokensId) {
      // Should not happen if session exists, but safeguard
      throw createError({ statusCode: 401, statusMessage: "Unauthorized - Session ID missing" });
    }

    let userId: string;
    let userEmail: string;

    // Fetch user details needed for logic
    try {
      userId = await getUserUUID(supertokensId);
      const userInfo = await supertokens.getUser(supertokensId);
      if (!userInfo || !userInfo.emails || userInfo.emails.length === 0) {
        throw new Error("Could not retrieve user email from SuperTokens");
      }
      userEmail = userInfo.emails[0].toLowerCase();
    } catch (userFetchError: any) {
      console.error("Error fetching user details during auth:", userFetchError);
      throw createError({ statusCode: 500, statusMessage: "Failed to fetch user details" });
    }

    // --- Read Body and Validate Input (Now inside the authenticated scope) ---
    const body = await readBody<ShareRequestBody>(event);
    const { finId, email: targetEmailRaw } = body;

    if (!finId || typeof finId !== 'string') {
      throw createError({ statusCode: 400, statusMessage: 'Missing or invalid finId' });
    }
    if (!targetEmailRaw || typeof targetEmailRaw !== 'string' || !targetEmailRaw.includes('@')) {
      throw createError({ statusCode: 400, statusMessage: 'Missing or invalid target email' });
    }

    const targetEmail = targetEmailRaw.toLowerCase().trim();

    // --- Business Logic (Inside the authenticated scope) ---
    try {
      // Prevent sharing with self
      if (targetEmail === userEmail) {
          throw createError({ statusCode: 400, statusMessage: 'Cannot share with yourself' });
      }

      // Verify Fin Ownership
      const finRecord = await db.select({ ownerId: finsTable.user_id })
        .from(finsTable)
        .where(eq(finsTable.id, finId))
        .limit(1);

      if (finRecord.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Fin record not found' });
      }
      if (finRecord[0].ownerId !== userId) {
          throw createError({ statusCode: 403, statusMessage: 'Forbidden - You do not own this record' });
      }

      // Check for Existing Share
      const existingShare = await db.select({ fin_id: finSharesTable.fin_id })
        .from(finSharesTable)
        .where(and(
          eq(finSharesTable.fin_id, finId),
          eq(finSharesTable.shared_with_user_email, targetEmail)
        ))
        .limit(1);

      if (existingShare.length > 0) {
        // Already shared, return explicit Response
        return new Response(JSON.stringify({ message: 'success', detail: 'Already shared with this email' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create Share Record
      await db.insert(finSharesTable).values({
        fin_id: finId,
        shared_with_user_email: targetEmail,
      });

      // Return explicit success Response
      return new Response(JSON.stringify({ message: 'success' }), {
        status: 200, // Or 201 if preferred for creation
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error: any) {
      console.error("Error processing share request:", error);
      if (error.statusCode) {
          throw error;
      }
      throw createError({ statusCode: 500, statusMessage: 'Failed to process share request' });
    }
  });
});