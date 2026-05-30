CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'JUDGE');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'JUDGE',
  "password_hash" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "must_change_password" BOOLEAN NOT NULL DEFAULT true,
  "last_login_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_sessions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_seen_at" TIMESTAMP(3),
  "user_agent" TEXT NOT NULL DEFAULT '',
  "ip_address" TEXT NOT NULL DEFAULT '',

  CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "idx_users_role" ON "users"("role");
CREATE INDEX "idx_users_active" ON "users"("active");
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions"("user_id");
CREATE INDEX "idx_user_sessions_expires_at" ON "user_sessions"("expires_at");

ALTER TABLE "user_sessions"
  ADD CONSTRAINT "user_sessions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
