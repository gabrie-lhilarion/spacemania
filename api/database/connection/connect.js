/**
 * @file PostgreSQL database connection pool configuration
 * @module db/index
 * @description Configures and exports a PostgreSQL connection pool with environment-based settings.
 * Handles database connections for the SpaceMania workspace management system.
 * @requires pg
 * @requires dotenv
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * @constant {Pool}
 * @description PostgreSQL connection pool instance
 * @property {string} user - Database user from environment variables
 * @property {string} host - Database host from environment variables
 * @property {string} database - Database name from environment variables
 * @property {string} password - Database password from environment variables
 * @property {number} port - Database port from environment variables
 * @property {boolean|Object} ssl - SSL configuration (enabled in production with relaxed authorization)
 */
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * @function testConnection
 * @description Tests the database connection by executing a simple query
 * @listens pool.query
 * @param {Error} err - Error object if connection fails
 * @returns {void} Logs connection status to console
 */
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection error', err.stack);
    } else {
        console.log('Connected to PostgreSQL database');
    }
});

/**
 * @namespace exports
 * @description Exported database interface
 * @property {function} query - Executes parameterized SQL queries
 * @property {Pool} pool - Direct access to the connection pool
 */
module.exports = {
    /**
     * @function query
     * @description Executes a parameterized SQL query
     * @param {string} text - SQL query text
     * @param {Array} [params] - Query parameters
     * @returns {Promise<Object>} Query result object
     */
    query: (text, params) => pool.query(text, params),

    /**
     * @property {Pool} pool
     * @description Direct access to the PostgreSQL connection pool
     * Useful for transactions and other pool-specific operations
     */
    pool
};