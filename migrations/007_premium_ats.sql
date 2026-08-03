-- Premium AI ATS Schema Upgrade

-- 1. Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    description TEXT,
    requirements TEXT, -- JSON or Text
    required_skills TEXT, -- Comma separated or JSON
    required_experience_years NUMERIC DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open', -- open, closed, draft
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_by UUID,
    created_by_name VARCHAR(255)
);

-- 2. Alter ATS Applications to support advanced AI JSON mapping
ALTER TABLE ats_applications 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES job_postings(id),
ADD COLUMN IF NOT EXISTS ai_structured_data JSONB, -- Will hold education, experience, parsed skills, etc.
ADD COLUMN IF NOT EXISTS ai_flags JSONB, -- Red flags
ADD COLUMN IF NOT EXISTS interview_questions JSONB,
ADD COLUMN IF NOT EXISTS cv_quality_score NUMERIC DEFAULT 100,
ADD COLUMN IF NOT EXISTS match_breakdown JSONB, -- Breakdown of scores
ADD COLUMN IF NOT EXISTS ai_confidence JSONB,
ADD COLUMN IF NOT EXISTS history JSONB DEFAULT '[]'::jsonb;
