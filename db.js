const Sequelize = require('sequelize');

// SQL Server
const MSSQL_DB_CLIENT = new Sequelize(
  process.env['SQL_SERVER_DB'], 
  process.env['SQL_SERVER_USER'], 
  process.env['SQL_SERVER_PASSWORD'], 
  {
    host: process.env['SQL_SERVER_HOST'],
    port: process.env['SQL_SERVER_PORT'],
    dialect: "mssql",
    pool: {
      "max": 10,
      "min": 0,
      "idle": 25000,
      "acquire": 25000,
      "requestTimeout": 300000
    },
    dialectOptions: {
      options: {
        encrypt: false,
        trustServerCertificate: true,
      }
    },
    logging: false,
    define: {
      timestamps: false
    },
  }
);

// SQLite
const SQLITE_DB_CLIENT = new Sequelize({
  dialect: 'sqlite',
  storage: 'db/api-backend.sqlite',
  logging: false,
  define: {
    timestamps: false
  },
});


const DB_CLIENT = (process.env['USE_SQLITE_TEST'] === 'true') ? SQLITE_DB_CLIENT : MSSQL_DB_CLIENT;

module.exports = {
  DB_CLIENT,
};