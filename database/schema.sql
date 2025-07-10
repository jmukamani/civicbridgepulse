-- PostgreSQL schema for CivicBridgePulse Kenya
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'representative', 'admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  -- Representative verification fields
  is_rep_verified BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(20) DEFAULT 'not_required' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'not_required')),
  verification_docs TEXT,
  -- Representative specialization areas
  specializations TEXT[], -- Array of specialization areas
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  -- Profile fields
  ward VARCHAR(255),
  county VARCHAR(255),
  age_range VARCHAR(10) CHECK (age_range IN ('18-24', '25-34', '35-44', '45-54', '55+')),
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 