CREATE TABLE IF NOT EXISTS branch_inventory (id serial PRIMARY KEY, branch_id integer NOT NULL, product_id integer NOT NULL, quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0), is_available boolean NOT NULL DEFAULT true, updated_by_user_id integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(branch_id, product_id));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS inventory_adjustments (id serial PRIMARY KEY, branch_id integer NOT NULL, product_id integer NOT NULL, actor_user_id integer NOT NULL, previous_quantity integer NOT NULL, new_quantity integer NOT NULL, previous_available boolean NOT NULL, new_available boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS inventory_adjustments_branch_created_idx ON inventory_adjustments(branch_id, created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS review_responses (id serial PRIMARY KEY, review_id integer NOT NULL UNIQUE, restaurant_id integer NOT NULL, response text NOT NULL, responder_user_id integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());