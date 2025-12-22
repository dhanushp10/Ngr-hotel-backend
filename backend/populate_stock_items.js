const pool = require("./db");

const ITEMS = [
    { code: '1a', name: 'CHICKEN' },
    { code: '2a', name: 'LEGES' },
    { code: '3a', name: 'CBL' },
    { code: '4a', name: 'LEG BL' },
    { code: '5a', name: 'LOLLYPOP' },
    { code: '6a', name: 'MUTTON' },
    { code: '7a', name: 'FISH' },
    { code: '8a', name: 'W.POMPRET' },
    { code: '9a', name: 'PANNER' },
    { code: '10a', name: 'PRAWNS' },
    { code: '11a', name: 'BABYCORN' },
    { code: '12a', name: 'NATIKODI' },
    { code: '13a', name: 'MUSHROOM' },
    { code: '14a', name: 'MAHI MAHI' }
];

async function run() {
    try {
        console.log("Populating kitchen_raw_items...");
        for (const item of ITEMS) {
            await pool.query(
                "INSERT INTO kitchen_raw_items (code, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)",
                [item.code, item.name]
            );
        }
        console.log("Done.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
