-- Migration: Add stats columns to sites and bots tables
-- Run this to add the new columns for persistent stats tracking

-- Add columns to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS total_earnings numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_requests integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_requests integer NOT NULL DEFAULT 0;

-- Add columns to bots table  
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS total_requests integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_requests integer NOT NULL DEFAULT 0;

-- Update existing data to populate the new columns
-- For sites: calculate earnings from existing successful crawls
UPDATE sites SET 
  total_earnings = (
    SELECT COALESCE(SUM(s.price_per_crawl), 0)
    FROM crawls c
    JOIN sites s ON c.site_id = s.id
    WHERE c.status = 'success' AND s.id = sites.id
  ),
  total_requests = (
    SELECT COUNT(*)
    FROM (
      SELECT id FROM crawls WHERE site_id = sites.id
      UNION ALL
      SELECT id FROM bot_crawl_logs WHERE site_id = sites.id
    ) combined
  ),
  successful_requests = (
    SELECT COUNT(*)
    FROM (
      SELECT id FROM crawls WHERE site_id = sites.id AND status = 'success'
      UNION ALL
      SELECT id FROM bot_crawl_logs WHERE site_id = sites.id AND status = 'success'
    ) combined
  );

-- For bots: calculate request counts from existing crawls
UPDATE bots SET
  total_requests = (
    SELECT COUNT(*)
    FROM (
      SELECT id FROM crawls WHERE bot_id = bots.id
      UNION ALL
      SELECT id FROM bot_crawl_logs WHERE bot_id = bots.id
    ) combined
  ),
  successful_requests = (
    SELECT COUNT(*)
    FROM (
      SELECT id FROM crawls WHERE bot_id = bots.id AND status = 'success'
      UNION ALL
      SELECT id FROM bot_crawl_logs WHERE bot_id = bots.id AND status = 'success'
    ) combined
  ); 