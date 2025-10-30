import os
from neon_serverless import neon

# Get database connection
NEON_DATABASE_URL = os.environ.get('NEON_DATABASE_URL')
sql = neon(DATABASE_URL)

print("[v0] Creating database tables...")

# Create items table
sql("""
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  marca VARCHAR(255),
  descripcion TEXT,
  image_url TEXT,
  has_variants BOOLEAN DEFAULT FALSE,
  is_container BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

print("[v0] Created items table")

# Create variants table
sql("""
CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  parent_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
  variant_sku VARCHAR(255) UNIQUE NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")

print("[v0] Created variants table")

# Create stock table
sql("""
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  item_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
  deposito VARCHAR(255) NOT NULL,
  cantidad INTEGER DEFAULT 0,
  UNIQUE(item_sku, deposito)
)
""")

print("[v0] Created stock table")

# Create attributes table
sql("""
CREATE TABLE IF NOT EXISTS item_attributes (
  id SERIAL PRIMARY KEY,
  item_sku VARCHAR(255) REFERENCES items(sku) ON DELETE CASCADE,
  attribute_type VARCHAR(50) NOT NULL,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  is_locked BOOLEAN DEFAULT FALSE
)
""")

print("[v0] Created item_attributes table")

# Create indexes
sql("CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku)")
sql("CREATE INDEX IF NOT EXISTS idx_variants_parent ON variants(parent_sku)")
sql("CREATE INDEX IF NOT EXISTS idx_stock_item ON stock(item_sku)")
sql("CREATE INDEX IF NOT EXISTS idx_attributes_item ON item_attributes(item_sku)")

print("[v0] Created indexes")
print("[v0] ✅ Database tables created successfully!")
