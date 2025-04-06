import { pgTable, varchar, timestamp, decimal, text, primaryKey } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar({ length: 255 }).primaryKey(),
  supertokens_id: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp().notNull().defaultNow(),
});

export const finsTable = pgTable("fins", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  date_from: timestamp().notNull(),
  date_to: timestamp().notNull(),
  total_amount: decimal({ precision: 10, scale: 2 }).notNull(),
  user_id: varchar({ length: 255 }).references(() => usersTable.id),
  created_at: timestamp().notNull().defaultNow(),
});

export const categoriesTable = pgTable("categories", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  user_id: varchar({ length: 255 }).references(() => usersTable.id),
  created_at: timestamp().notNull().defaultNow(),
});

export const bitsTable = pgTable("bits", {
  id: varchar({ length: 255 }).primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  amount: decimal({ precision: 10, scale: 2 }).notNull(),
  date: timestamp().notNull(),
  note: text(),
  created_at: timestamp().notNull().defaultNow(),
  category_id: varchar({ length: 255 }).references(() => categoriesTable.id),
  fin_id: varchar({ length: 255 }).references(() => finsTable.id),
});

export const finSharesTable = pgTable("fin_shares", {
  fin_id: varchar({ length: 255 }).notNull().references(() => finsTable.id, { onDelete: 'cascade' }),
  shared_with_user_email: varchar({ length: 255 }).notNull(),
  shared_at: timestamp().notNull().defaultNow(),
}, (table) => {
  return {
    // Composite primary key to ensure uniqueness
    pk: primaryKey({ columns: [table.fin_id, table.shared_with_user_email] }),
  };
});