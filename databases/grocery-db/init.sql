CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE grocery_category AS ENUM (
    'PRODUCE',
    'DAIRY',
    'MEAT',
    'SEAFOOD',
    'BAKERY',
    'PANTRY',
    'FROZEN',
    'BEVERAGES',
    'SPICES',
    'OTHER'
);

CREATE TABLE IF NOT EXISTS recipes (
    recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grocery_lists (
    grocery_list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    outdated BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grocery_list_recipes (
    grocery_list_id UUID NOT NULL,
    recipe_id UUID NOT NULL,
    PRIMARY KEY (grocery_list_id, recipe_id),
    CONSTRAINT fk_grocery_list_recipes_grocery_list
        FOREIGN KEY (grocery_list_id)
        REFERENCES grocery_lists (grocery_list_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_grocery_list_recipes_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipes (recipe_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS grocery_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    quantity DOUBLE PRECISION,
    unit VARCHAR(50) NOT NULL,
    category grocery_category NOT NULL DEFAULT 'OTHER',
    is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    recipe_id UUID,
    grocery_list_id UUID,
    CONSTRAINT fk_grocery_items_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipes (recipe_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_grocery_items_grocery_list
        FOREIGN KEY (grocery_list_id)
        REFERENCES grocery_lists (grocery_list_id)
        ON DELETE CASCADE,
    CONSTRAINT chk_grocery_items_owner
        CHECK (recipe_id IS NOT NULL OR grocery_list_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_recipes_user_id
    ON recipes (user_id);

CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id
    ON grocery_lists (user_id);

CREATE INDEX IF NOT EXISTS idx_grocery_list_recipes_recipe_id
    ON grocery_list_recipes (recipe_id);

CREATE INDEX IF NOT EXISTS idx_grocery_items_recipe_id
    ON grocery_items (recipe_id);

CREATE INDEX IF NOT EXISTS idx_grocery_items_grocery_list_id
    ON grocery_items (grocery_list_id);
