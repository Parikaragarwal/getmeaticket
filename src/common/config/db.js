import pg from "pg";
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  // host: "localhost",
  // port: process.env.PORT || 4000,
  // user: "postgres",
  // password: "postgres",
  // database: "sql_class_2_db",
  // max: 20,
  // connectionTimeoutMillis: 0,
  // idleTimeoutMillis: 0,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
  },
});

export default pool