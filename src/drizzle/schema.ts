import { sql } from "drizzle-orm";
import {
    bigint,
    foreignKey,
    pgEnum,
    pgPolicy,
    pgSchema,
    pgTable,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

const auth = pgSchema("auth");

export const users = auth.table("users", {
  id: uuid().primaryKey().notNull(),
});

export const appPermission = pgEnum("app_permission", [
  "dashboard.view",
  "rooms.manage",
  "tenants.manage",
  "assignments.manage",
  "bills.manage",
  "payments.manage",
  "billing.view_all",
  "billing.view_own",
]);
export const appRole = pgEnum("app_role", ["admin", "tenant"]);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "role_permissions_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: Number.MAX_SAFE_INTEGER,
      cache: 1,
    }),
    role: appRole().notNull(),
    permission: appPermission().notNull(),
  },
  (table) => [
    unique("role_permissions_role_permission_key").on(
      table.role,
      table.permission,
    ),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: "number" }).primaryKey().generatedByDefaultAsIdentity({
      name: "user_roles_id_seq",
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: Number.MAX_SAFE_INTEGER,
      cache: 1,
    }),
    userId: uuid("user_id").notNull(),
    role: appRole().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "user_roles_user_id_fkey",
    }).onDelete("cascade"),
    unique("user_roles_user_id_key").on(table.userId),
    pgPolicy("Allow auth admin to read user roles", {
      as: "permissive",
      for: "select",
      to: ["supabase_auth_admin"],
      using: sql`true`,
    }),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    name: text().notNull(),
    id: uuid().primaryKey().notNull(),
    email: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.id],
      foreignColumns: [users.id],
      name: "profiles_id_auth_users_id_fk",
    }).onDelete("cascade"),
  ],
);
