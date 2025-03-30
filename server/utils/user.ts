import { query } from './db';

export async function getUserUUID(supertokensId: string): Promise<string> {
    const result = await query(
        'SELECT id FROM users WHERE supertokens_id = $1',
        [supertokensId]
    );
    
    if (result.rows.length === 0) {
        throw createError({ 
            statusCode: 404, 
            statusMessage: 'User not found' 
        });
    }
    
    return result.rows[0].id;
}