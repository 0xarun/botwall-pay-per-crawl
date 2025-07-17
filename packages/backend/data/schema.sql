-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK(role IN ('site_owner', 'bot_developer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK(role IN ('site_owner', 'bot_developer')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SITES
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  price_per_crawl NUMERIC(10,4) NOT NULL DEFAULT 0.01,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- BOTS
CREATE TABLE bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_name TEXT NOT NULL,
  bot_id TEXT UNIQUE NOT NULL,
  api_key TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  usage_reason TEXT,
  public_key TEXT,
  private_key TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CRAWLS
CREATE TABLE crawls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  status TEXT CHECK(status IN ('success', 'failed', 'blocked')) NOT NULL,
  path TEXT NOT NULL,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- TRANSACTIONS
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  status TEXT CHECK(status IN ('pending', 'completed', 'failed')) NOT NULL,
  lemon_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sites_owner_id ON sites(owner_id);
CREATE INDEX idx_bots_developer_id ON bots(developer_id);
CREATE INDEX idx_bots_bot_id ON bots(bot_id);
CREATE INDEX idx_crawls_bot_id ON crawls(bot_id);
CREATE INDEX idx_crawls_site_id ON crawls(site_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);