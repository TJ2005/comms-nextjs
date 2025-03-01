/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
    .createTable("users", (table) => {
      table.increments("id").primary();
      table.string("username").notNullable();
      table.string("profile_picture_url");
    })
    .createTable("sessions", (table) => {
      table.increments("id").primary();
      table.string("code").notNullable();
      table.jsonb("session_settings").defaultTo(
        JSON.stringify({
          max_users: 5,
          delete_messages: false,
          edit_messages: true,
          allow_new_users: true,
        })
      );
    })
    .createTable("user_sessions", (table) => {
      table.integer("user_id").references("id").inTable("users").onDelete("CASCADE");
      table.integer("session_id").references("id").inTable("sessions").onDelete("CASCADE");
      table.boolean("is_admin").defaultTo(false);
      table.primary(["user_id", "session_id"]);
    })
    .createTable("messages", (table) => {
      table.increments("id").primary();
      table.integer("user_id").references("id").inTable("users").onDelete("CASCADE");
      table.integer("session_id").references("id").inTable("sessions").onDelete("CASCADE");
      table.text("content");
      table.string("file_url");
      table.timestamp("timestamp").defaultTo(knex.fn.now());
      table.string("message_type").notNullable();
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
    .dropTableIfExists("messages")
    .dropTableIfExists("user_sessions")
    .dropTableIfExists("sessions")
    .dropTableIfExists("users");
};
