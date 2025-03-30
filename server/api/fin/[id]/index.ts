import { query } from '~/server/utils/db';
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

    if (event.method === "GET") {
      const results = await query(
        "SELECT name FROM fins WHERE id = $1 AND user_id = $2 LIMIT 1",
        [event?.context?.params?.id || "", userId]
      );

      return new Response(JSON.stringify(results.rows[0]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "POST") {
      const body = await readBody(event);

      const results = await query(
        "INSERT INTO fins (user_id, name) VALUES ($1, $2) RETURNING id",
        [userId, body.name]
      );

      return new Response(JSON.stringify({ message: "success", id: results.rows[0].id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "DELETE") {
      // Verify the fin belongs to the user
      const finCheck = await query(
        "SELECT id FROM fins WHERE id = $1 AND user_id = $2",
        [event?.context?.params?.id, userId]
      );

      if (finCheck.rows.length === 0) {
        throw createError({ statusCode: 403, statusMessage: "Unauthorized access to this fin" });
      }

      await query(
        "DELETE FROM fins WHERE id = $1 AND user_id = $2",
        [event?.context?.params?.id, userId]
      );

      // Return 200 with success message
      return new Response(JSON.stringify({ 
        status: 200,
        body: { message: "success" }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (event.method === "PUT") {
      const body = await readBody(event);

      await query(
        "UPDATE fins SET name = $1 WHERE id = $2 AND user_id = $3",
        [body.name, event?.context?.params?.id || "", userId]
      );

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
