const pool = require("../db");

async function populateBranches() {
    try {
        await pool.query("USE hotel_dispatch3");

        console.log("Populating branches table...\n");

        const branches = [
            'HNR',
            'CHIMNY',
            'INR',
            'KRM',
            'BGR',
            'MRH',
            'NWF',
            'NAKK'
        ];

        for (const branchName of branches) {
            await pool.query(
                'INSERT INTO branches (branch_name) VALUES (?)',
                [branchName]
            );
        }

        console.log(`✓ Inserted ${branches.length} branches`);

        // Verify
        const [result] = await pool.query('SELECT * FROM branches');
        console.log('\nBranches:');
        console.table(result);

        process.exit(0);

    } catch (err) {
        console.error("Error populating branches:", err);
        process.exit(1);
    }
}

populateBranches();
