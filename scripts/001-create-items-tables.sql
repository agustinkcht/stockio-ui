-- Create items table for both container and individual items
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  codigo_universal TEXT,
  marca TEXT,
  modelo TEXT,
  formato_venta TEXT,
  proveedor TEXT,
  codigo_proveedor TEXT,
  descripcion TEXT,
  foto TEXT,
  has_variants BOOLEAN DEFAULT FALSE,
  is_agrupador BOOLEAN DEFAULT FALSE,
  variant_count INTEGER DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  volumen_active BOOLEAN DEFAULT FALSE,
  volumen_cantidad NUMERIC,
  volumen_unidad TEXT,
  unidades_por_pack_active BOOLEAN DEFAULT FALSE,
  unidades_por_pack INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create variants table for items with variants
CREATE TABLE IF NOT EXISTS item_variants (
  id SERIAL PRIMARY KEY,
  parent_sku TEXT NOT NULL REFERENCES items(sku) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  codigo_universal TEXT,
  marca TEXT,
  modelo TEXT,
  formato_venta TEXT,
  proveedor TEXT,
  codigo_proveedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock table for items and variants
CREATE TABLE IF NOT EXISTS stock (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  total INTEGER DEFAULT 0,
  reservado INTEGER DEFAULT 0,
  disponible INTEGER DEFAULT 0,
  deposito TEXT DEFAULT 'principal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sku, deposito)
);

-- Create atributos principales table
CREATE TABLE IF NOT EXISTS atributos_principales (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (sku) REFERENCES items(sku) ON DELETE CASCADE
);

-- Create atributos informativos table
CREATE TABLE IF NOT EXISTS atributos_informativos (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (sku) REFERENCES items(sku) ON DELETE CASCADE
);

-- Create container atributos principales table (for items with variants)
CREATE TABLE IF NOT EXISTS container_atributos_principales (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL,
  key TEXT NOT NULL,
  variantes TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (sku) REFERENCES items(sku) ON DELETE CASCADE
);

-- Create variant atributos principales table
CREATE TABLE IF NOT EXISTS variant_atributos_principales (
  id SERIAL PRIMARY KEY,
  variant_sku TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (variant_sku) REFERENCES item_variants(sku) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_has_variants ON items(has_variants);
CREATE INDEX IF NOT EXISTS idx_variants_parent_sku ON item_variants(parent_sku);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON item_variants(sku);
CREATE INDEX IF NOT EXISTS idx_stock_sku ON stock(sku);
CREATE INDEX IF NOT EXISTS idx_atributos_principales_sku ON atributos_principales(sku);
CREATE INDEX IF NOT EXISTS idx_atributos_informativos_sku ON atributos_informativos(sku);
CREATE INDEX IF NOT EXISTS idx_container_atributos_sku ON container_atributos_principales(sku);
CREATE INDEX IF NOT EXISTS idx_variant_atributos_sku ON variant_atributos_principales(variant_sku);
