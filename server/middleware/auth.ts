import { withSession } from "supertokens-node/custom";
import supertokens from "supertokens-node";

export default defineEventHandler(async (event) => {
    try {
        const request = await convertToRequest(event);
        await withSession(request, async (err, session) => {
            if (err) {
                throw createError({ statusCode: 500, statusMessage: err.message || "Internal server error" });
            }

            let userInfo = await supertokens.getUser(session!.getUserId());

            if (userInfo) {
                const results = await query(
                    'SELECT id, supertokens_id FROM users WHERE email = $1 LIMIT 1',
                    [userInfo.emails[0]]
                )

                if (results.rows.length === 0) {
                    await query(
                        'INSERT INTO users (id, supertokens_id, email) VALUES (gen_random_uuid(), $1, $2)',
                        [userInfo.id, userInfo.emails[0]]
                    )
                } else {
                    if (results.rows[0].supertokens_id !== userInfo.id) {
                        await query(
                            'UPDATE users SET supertokens_id = $1 WHERE email = $2',
                            [userInfo.id, userInfo.emails[0]]
                        )
                    }
                }
            }
            return new Response(JSON.stringify(userInfo), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        });
    } catch (err) {
        console.error(err);
        event.node.res.statusCode = 500;
    }
});
