CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Dev admin account: login with admin@bytebite.dev / password
INSERT INTO users (name, email, password_hash) VALUES (
    'Admin',
    'admin@bytebite.dev',
    '$2b$12$F0rLm1sYDRHEUjQkni8z3e7dpeFNW4irxo4jkMgP4YMGffswtD.OS'
) ON CONFLICT (email) DO NOTHING;
