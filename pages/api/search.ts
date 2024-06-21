import { AppDataSource, Cast, initializeDataSourceWithRetry } from '@/lib/db';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    maxDuration: 30,
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    let { term, limit, offset } = req.query;
    const { interval, orderBy } = req.query;

    if (typeof term !== 'string' || term.length < 3) {
        return res.status(400).json({ error: 'Invalid search term' });
    }
    if (!limit) {
        limit = '5';
    }

    if (!offset) {
        offset = '0';
    }

    const start = process.hrtime();

    await initializeDataSourceWithRetry();
    const dbConnectEnd = process.hrtime(start);

    // replaces spaces with + for tsquery
    term = term.replace(/ /g, '+');
    const query = `
    SELECT 
        hash, fid
    FROM casts 
    WHERE 
        tsv @@ to_tsquery($1)
        ${interval ? `AND timestamp >= NOW() - INTERVAL '${interval}'` : ''}
        ${orderBy ? `ORDER BY ${orderBy}` : ''}
    LIMIT $2 OFFSET $3`;
    const vars = [term, limit, offset];

    try {
        const queryStart = process.hrtime();

        const searchRepository = AppDataSource.getRepository(Cast);
        const results = await searchRepository.query(query, vars);
        const queryEnd = process.hrtime(queryStart);
        const totalEnd = process.hrtime(start);

        console.log(`DB Connection Time: ${dbConnectEnd[0] * 1000 + dbConnectEnd[1] / 1e6} ms`);
        console.log(`Query Execution Time: ${queryEnd[0] * 1000 + queryEnd[1] / 1e6} ms`);
        console.log(`Total Request Time: ${totalEnd[0] * 1000 + totalEnd[1] / 1e6} ms`);

        res.status(200).json(results);
    } catch (error) {
        console.log('error in search', error);
        res.status(500).json({ error: `Failed to fetch search results ${error}` });
    }
}