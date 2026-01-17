import Database from 'better-sqlite3'

async function initailizeDatabase() {
        const option = { verbose : console.log};
        const db = new Database('hospital.db',option);
        return db;
}

const db = await initailizeDatabase();

export default db;