CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  payment_method TEXT NOT NULL,
  customer JSONB NOT NULL,
  items JSONB NOT NULL,
  total NUMERIC(12, 2) NOT NULL,
  pdf_sent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
