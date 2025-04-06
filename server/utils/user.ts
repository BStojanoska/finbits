import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { usersTable } from '~/server/db/schema';

export async function getUserUUID(supertokensId: string): Promise<string> {
    const result = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.supertokens_id, supertokensId))
        .limit(1);
    
    if (result.length === 0) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'User not found' 
        });
    }
    
    return result[0].id;
}

export async function getUserDetails(supertokensId: string): Promise<{ id: string; email: string }> {
    const result = await db
        .select({ id: usersTable.id, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.supertokens_id, supertokensId))
        .limit(1);
    
    if (result.length === 0) {
        throw createError({
            statusCode: 404,
            statusMessage: 'User not found'
        });
    }
    
    return result[0];
}