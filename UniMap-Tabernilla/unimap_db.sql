/* SQL script to create the users table for Unified Map application */
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
/** Indexes for faster lookups on username and email */
CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);

SELECT 'Table created successfully!' as status;


/* Added profile_picture column to users table */
ALTER TABLE users ADD COLUMN profile_picture TEXT;