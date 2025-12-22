const pool = require("../db");

async function populateDishes() {
    try {
        await pool.query("USE hotel_dispatch3");

        console.log("Populating dishes table...\n");

        // Main dishes from image 1
        const mainDishes = [
            [12, 'CB', 203.00],
            [14, 'MB', 235.00],
            [35, 'VB', 152.00],
            [1, 'CC', 204.00],
            [2, 'CF', 171.00],
            [4, 'C.65', 208.00],
            [3, 'CR', 205.00],
            [7, 'CK', 188.00],
            [51, 'CP', 210.00],
            [80, 'GTR-SD', 219.00],
            [49, 'C.LEMON', 203.00],
            [213, 'CNR', 226.00],
            [151, 'CNG', 207.00],
            [5, 'C.SIXER', 224.00],
            [38, 'CM', 185.00],
            [215, 'CLP', 204.00],
            [50, 'CCBNLS', 219.00],
            [54, 'MKB', 204.00],
            [83, 'KARIVEPAKU CHICKEN', 226.00],
            [8, 'MF', 225.00],
            [55, 'MPBL', 285.00],
            [93, 'M.KHEEMA', 212.00],
            [9, 'M.ROAST', 281.00],
            [17, 'FF', 305.00],
            [18, 'FC', 297.00],
            [33, 'FISH SIMHAPURI', 345.00],
            [114, 'PRNS', 286.00],
            [501, 'SAMBAR', 134.00],
            [502, 'RASAM', 94.00],
            [503, 'DHALL', 227.00],
            [504, 'PALYA', 158.00],
            [505, 'CHATNEY', 117.00],
            [506, 'SWEET', 156.00],
            [507, 'B.GRAVY', 76.00],
            [508, 'C.BONELESS', 348.00],
            [509, 'PEPPER MSL', 0.00],
            [510, 'EGG CURRY', 106.00],
            [159, 'TANDOORI', 0.00],
            [130, 'MIX VEG CURRY', 148.00],
            [27, 'PANEER BUTTER', 145.00],
            [534, 'COATING MASALA', 71.00],
            [535, 'PPR.MASALA', 64.00],
            [536, 'SHOLEY MSL', 64.00],
            [531, 'PANNER', 367.00],
            [532, 'BABYCORN', 105.00],
            [533, 'MUSHROOM', 175.00],
            [514, 'LEMON', 84.00],
            [515, 'CUCUMBER', 26.00],
            [516, 'CARROT', 83.00],
            [517, 'CORIANDER', 16.00],
            [518, 'KAREPAK', 34.00],
            [519, 'GREEN CHILLY', 42.00],
            [520, 'ONIONS', 30.00],
            [521, 'TOMATO', 23.00],
            [522, 'PUDINA', 5.00],
            [523, 'GOBI', 32.00],
            [524, 'GONGURA', 118.00],
            [525, 'GUN POWDER', 236.00],
            [526, 'GHEE', 660.00],
            [527, 'GRAM DHALL', 80.00],
            [528, 'MUSTARD', 105.00],
            [529, 'URADHALL', 164.00],
            [530, 'ROST POWDER', 450.00],
            [537, 'BLACK PEPPER', 895.00],
            [540, 'CASHEWNUTS', 741.00],
            [541, 'SUGAR', 42.00],
            [542, 'MAIDHA', 37.50],
            [543, 'BUTTER', 528.00],
            [544, 'CREAM', 210.00],
            [57, 'CNSD', 216.00],
            [53, 'M.CURRY', 211.00],
            [30, 'MUSHROOM MSL', 149.00],
            [84, 'FISH 65', 265.00],
            [31, 'NKF', 229.00],
            [32, 'NKM', 257.00]
        ];

        // Stock items from image 2
        const stockItems = [
            ['1a', 'CHICKEN', 0.00],
            ['2a', 'LEGES', 0.00],
            ['3a', 'CBL', 0.00],
            ['4a', 'LEG BL', 0.00],
            ['5a', 'LOLLYPOP', 0.00],
            ['6a', 'MUTTON', 0.00],
            ['7a', 'FISH', 0.00],
            ['8a', 'W.POMPRET', 0.00],
            ['9a', 'PANNER', 0.00],
            ['10a', 'PRAWNS', 0.00],
            ['11a', 'BABYCORN', 0.00],
            ['12a', 'NATIKODI', 0.00],
            ['13a', 'MUSHROOM', 0.00],
            ['14A', 'MAHI MAHI', 0.00]
        ];

        // Insert main dishes
        for (const [code, name, rate] of mainDishes) {
            await pool.query(
                'INSERT INTO dishes (code_no, item_name, rate) VALUES (?, ?, ?)',
                [code, name, rate]
            );
        }
        console.log(`✓ Inserted ${mainDishes.length} main dishes`);

        // Insert stock items
        for (const [code, name, rate] of stockItems) {
            await pool.query(
                'INSERT INTO dishes (code_no, item_name, rate) VALUES (?, ?, ?)',
                [code, name, rate]
            );
        }
        console.log(`✓ Inserted ${stockItems.length} stock items`);

        console.log(`\n✅ Total dishes inserted: ${mainDishes.length + stockItems.length}`);

        // Verify
        const [count] = await pool.query('SELECT COUNT(*) as total FROM dishes');
        console.log(`\nVerification: ${count[0].total} dishes in database`);

        process.exit(0);

    } catch (err) {
        console.error("Error populating dishes:", err);
        process.exit(1);
    }
}

populateDishes();
