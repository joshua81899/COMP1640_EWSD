// migrations/migrate.js - Database schema checker and migration tool
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Define the required database schema as per Database EWSD.docx
// Check if we're in reset mode (drops tables and recreates them)
const resetMode = process.argv.includes('--reset');

const createTablesSQL = `
-- Create Roles table
CREATE TABLE IF NOT EXISTS roles (
  role_id SERIAL PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL,
  description VARCHAR NOT NULL
);

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  faculty_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP,
  CONSTRAINT fk_role FOREIGN KEY(role_id) REFERENCES roles(role_id)
);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  submission_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  file_path VARCHAR(255) NOT NULL,
  submitted_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Submitted', 'Rejected')),
  terms_accepted BOOLEAN NOT NULL,
  academic_year VARCHAR(10) NOT NULL,
  selected BOOLEAN NOT NULL,
  CONSTRAINT fk_submission_user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS comments (
  comment_id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  comment_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_comment_submission FOREIGN KEY(submission_id) REFERENCES submissions(submission_id),
  CONSTRAINT fk_comment_user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Create Logs table
CREATE TABLE IF NOT EXISTS logs (
  log_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  log_timestamp TIMESTAMP NOT NULL,
  CONSTRAINT fk_log_user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Create AcademicSettings table
CREATE TABLE IF NOT EXISTS academic_settings (
  setting_id SERIAL PRIMARY KEY,
  academic_year VARCHAR(10) NOT NULL,
  submission_deadline DATE NOT NULL,
  final_edit_deadline DATE NOT NULL
);

-- Create Admissions table
CREATE TABLE IF NOT EXISTS admissions (
  admission_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  admission_status VARCHAR NOT NULL,
  admission_date DATE NOT NULL,
  CONSTRAINT fk_admission_user FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Create Faculties table (added for faculty management)
CREATE TABLE IF NOT EXISTS faculties (
  faculty_id SERIAL PRIMARY KEY,
  faculty_name VARCHAR(100) NOT NULL,
  description TEXT,
  coordinator_id INT
);

-- Create page_visits table (for analytics)
CREATE TABLE IF NOT EXISTS page_visits (
  visit_id SERIAL PRIMARY KEY,
  user_id INT,
  page_url VARCHAR(255) NOT NULL,
  visit_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  browser_info VARCHAR(255),
  ip_address VARCHAR(45),
  time_spent INT,
  CONSTRAINT fk_visit_user FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE SET NULL
);`;

// Initial data to seed the database
const seedDataSQL = `
-- Insert roles (if they don't exist)
INSERT INTO roles (role_id, role_name, description)
VALUES 
  (1, 'Admin', 'System administrator with all privileges'),
  (2, 'Marketing Manager', 'University Marketing Manager who oversees the process'),
  (3, 'Marketing Coordinator', 'Faculty Marketing Coordinator who manages the process for their Faculty'),
  (4, 'Student', 'Student who can submit articles and images')
ON CONFLICT (role_id) DO NOTHING;

-- Insert faculties (if they don't exist)
INSERT INTO faculties (faculty_id, faculty_name, description)
VALUES 
  (1, 'Arts & Humanities', 'Faculty of Arts and Humanities'),
  (2, 'Business', 'Faculty of Business'),
  (3, 'Education', 'Faculty of Education'),
  (4, 'Engineering', 'Faculty of Engineering'),
  (5, 'Health Sciences', 'Faculty of Health Sciences'),
  (6, 'Law', 'Faculty of Law'),
  (7, 'Science', 'Faculty of Science'),
  (8, 'Social Sciences', 'Faculty of Social Sciences')
ON CONFLICT (faculty_id) DO NOTHING;

-- Insert admin user if it doesn't exist
INSERT INTO users (email, first_name, last_name, password, faculty_id, role_id)
VALUES ('admin@university.edu', 'Admin', 'User', 
        '$2a$12$K3JNi5xUxx9dHh18kBim4eC0UJ4gpQqIBEfkzDIm7r6WFuaQFGKsW', 1, 1)
ON CONFLICT (email) DO NOTHING;

-- Insert academic settings for current year
INSERT INTO academic_settings (setting_id, academic_year, submission_deadline, final_edit_deadline)
VALUES (1, '2024-2025', '2025-05-25', '2025-06-23')
ON CONFLICT (setting_id) DO NOTHING;
`;

// Function to drop tables in reverse order (for --reset mode)
const dropTablesSQL = `
DROP TABLE IF EXISTS page_visits CASCADE;
DROP TABLE IF EXISTS admissions CASCADE;
DROP TABLE IF EXISTS academic_settings CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
`;

// Main migration function
async function runMigration() {
  console.log('Starting database migration...');
  
  let client;
  try {
    client = await pool.connect();
    
    // Begin transaction
    await client.query('BEGIN');
    
    if (resetMode) {
      console.log('RESET MODE: Dropping all existing tables...');
      await client.query(dropTablesSQL);
      console.log('Tables dropped successfully');
    }
    
    console.log('Creating tables if they don\'t exist...');
    await client.query(createTablesSQL);
    console.log('Database schema created/updated successfully');
    
    console.log('Seeding initial data...');
    await client.query(seedDataSQL);
    console.log('Initial data seeded successfully');

    // Analyze tables to optimize query planning
    await client.query('ANALYZE');
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
    
    // Get table counts for verification
    const tables = ['roles', 'faculties', 'users', 'submissions', 'comments', 'page_visits'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`Table ${table}: ${result.rows[0].count} rows`);
    }
    
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run the migration
runMigration().then(() => {
  console.log('Migration script completed');
}).catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});