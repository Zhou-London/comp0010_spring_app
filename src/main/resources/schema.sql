-- Database schema for COMP0010 Spring application

DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  entry_year INTEGER,
  graduate_year INTEGER,
  major VARCHAR(255),
  tuition_fee NUMERIC(10, 2),
  paid_tuition_fee NUMERIC(10, 2),
  birth_date DATE,
  home_student BOOLEAN,
  sex VARCHAR(50)
);

CREATE TABLE modules (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  mnc BOOLEAN NOT NULL
);

CREATE TABLE grades (
  id BIGSERIAL PRIMARY KEY,
  score INTEGER NOT NULL,
  student_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  FOREIGN KEY (student_id)
    REFERENCES students (id),
  FOREIGN KEY (module_id)
    REFERENCES modules (id)
);

CREATE TABLE registrations (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  module_id BIGINT NOT NULL,
  CONSTRAINT unique_registration UNIQUE (student_id, module_id),
  FOREIGN KEY (student_id)
    REFERENCES students (id),
  FOREIGN KEY (module_id)
    REFERENCES modules (id)
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  auth_token VARCHAR(255) UNIQUE
);
