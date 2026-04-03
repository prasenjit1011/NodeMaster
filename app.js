console.clear();
console.log('\n\n-: App Started :-');

const express   = require('express');
const app       = express();
const mariadb   = require('mariadb');
const pool = mariadb.createPool({
  host: '127.0.0.1',
  user: 'company',
  password: 'Lnsel@345',
  port: 3306,
  database: 'company',
  connectionLimit: 5
});


async function createTable() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query("DROP TABLE IF EXISTS company");

    await conn.query(`
        CREATE TABLE product (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) UNIQUE,
            price decimal(10, 2) NOT NULL,
            status BOOLEAN DEFAULT true
        )
    `);

    console.log("Table created ✅");
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) conn.release();
  }
}
async function insertData() {
  let conn;
  try {
    conn = await pool.getConnection();

    await conn.query(
        `INSERT INTO company (name, address, status)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                address = VALUES(address),
                status = VALUES(status)
            `, ["Moon Ltd", "Delhi", true]
        );

    console.log("Data inserted ✅");
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) conn.release();
  }
}
async function fetchCompanies() {
  let conn;
  try {
    conn = await pool.getConnection();

    const rows = await conn.query("SELECT * FROM company");
    console.log("Companies:", rows);
    return rows;
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) conn.release();
  }
}

// async function runDB() {
//   await createTable();
//   await insertData();
//   await fetchCompanies();
// }

// runDB();
app.get('/company/createtable', async (req, res, next) => {
    await createTable();
    console.log('Welcome to Express App');
    return res.send('Table created successfully');
});

app.get('/company/insertData', async (req, res, next) => {
    await insertData();
    console.log('Welcome to Express App');
    return res.send('Company inserted successfully');
});
app.get('/company', async (req, res, next) => {
    let data = await fetchCompanies()
    console.log('Data from DB:', data);
    return res.send(data);
});


app.use('/', (req, res, next)=>{
    console.log('-: Welcome :-');
    res.send('-: Welcome :-');

    next()
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    console.error('Central Error Handler:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

console.log('-: App Running :-');
app.listen(3000);