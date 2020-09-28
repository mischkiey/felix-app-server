CREATE TABLE IF NOT EXISTS "goals" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "user_id" INTEGER REFERENCES "users"(id) 
    ON DELETE CASCADE NOT NULL,
  "goal_amount" BIGINT CHECK (goal_amount > 0) 
    DEFAULT 0 NOT NULL,
  "contribution_amount" BIGINT CHECK (contribution_amount > 0)
    DEFAULT 0 NOT NULL,
  "current_amount" BIGINT CHECK (current_amount >= 0)
    DEFAULT 0 NOT NULL,
  "end_date" TIMESTAMPTZ DEFAULT now() NOT NULL,
  "completed" BOOLEAN DEFAULT false NOT NULL,
  "date_created" TIMESTAMPTZ DEFAULT now() NOT NULL
);