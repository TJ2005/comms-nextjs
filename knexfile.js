// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      user: 'postgres',
      host: 'localhost',
      database: 'comms',
      password: 'root',
      port: 5432,
    },
    migrations: {
      directory: './migrations',
    },
  },

  staging: {
    client: 'pg',
    connection: {
      user: 'postgres',
      host: 'localhost',
      database: 'comms',
      password: 'root',
      port: 5432,
    },
    migrations: {
      directory: './migrations',
    },
  },

  production: {
    client: 'pg',
    connection: {
      user: 'postgres',
      host: 'localhost',
      database: 'comms',
      password: 'root',
      port: 5432,
    },
    migrations: {
      directory: './migrations',
    },
  }

};
