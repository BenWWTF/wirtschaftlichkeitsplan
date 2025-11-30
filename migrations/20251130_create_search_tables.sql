-- Search Analytics Table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_id queries
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON search_analytics(created_at DESC);

-- Full-text search indexes on expenses
CREATE INDEX IF NOT EXISTS idx_expenses_search ON expenses USING GIN(
  to_tsvector('german', COALESCE(description, '') || ' ' || COALESCE(category, ''))
);

-- Full-text search indexes on therapies
CREATE INDEX IF NOT EXISTS idx_therapies_search ON therapies USING GIN(
  to_tsvector('german', name)
);

-- Saved Filters Table
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  collection TEXT,
  filter_criteria JSONB NOT NULL,
  page_type TEXT CHECK (page_type IN ('expenses', 'therapies', 'results')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Create indexes for saved filters
CREATE INDEX IF NOT EXISTS idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_filters_page_type ON saved_filters(user_id, page_type);
CREATE INDEX IF NOT EXISTS idx_saved_filters_is_default ON saved_filters(user_id, is_default);

-- Filter Analytics Table
CREATE TABLE IF NOT EXISTS filter_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filter_criteria JSONB NOT NULL,
  results_count INT DEFAULT 0,
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for filter analytics
CREATE INDEX IF NOT EXISTS idx_filter_analytics_user_id ON filter_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_analytics_created_at ON filter_analytics(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE filter_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search_analytics
CREATE POLICY "Users can view their own search analytics"
  ON search_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search analytics"
  ON search_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for saved_filters
CREATE POLICY "Users can view their own saved filters"
  ON saved_filters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved filters"
  ON saved_filters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved filters"
  ON saved_filters FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved filters"
  ON saved_filters FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for filter_analytics
CREATE POLICY "Users can view their own filter analytics"
  ON filter_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own filter analytics"
  ON filter_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);
