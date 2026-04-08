import mariadb, { Pool, PoolConnection } from "mariadb";
import dotenv from "dotenv";

dotenv.config();

// Create Pool
const pool: Pool = mariadb.createPool({
  host: process.env.DB_HOST as string,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  database: process.env.DB_NAME as string,
  port: Number(process.env.DB_PORT) || 3306,
  connectionLimit: 5,
});

// Generic Query Function
export async function query<T>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  let conn: PoolConnection | undefined;

  try {
    conn = await pool.getConnection();
    const result = await conn.query(sql, params);

    return result as T;
  } catch (error) {
    console.error("DB Error:", error);
    throw error;
  } finally {
    if (conn) conn.release();
  }
}