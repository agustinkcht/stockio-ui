import os
from neon_serverless import neon

# Get database connection
NEON_DATABASE_URL = os.environ.get('NEON_DATABASE_URL')
sql = neon(DATABASE_URL)

print("[v0] Seeding initial data...")

# Insert initial items
sql("""
INSERT INTO items (sku, titulo, marca, descripcion, has_variants, is_container) VALUES
('ITEM-SIN-ATRIBUTOS-1', 'Item Sin Atributos 1', 'Marca Ejemplo', 'Descripción del item sin atributos', FALSE, FALSE),
('VINO-TRAPICHE-GRAN-MEDALLA', 'Vino Trapiche Gran Medalla', 'Trapiche', 'Vino premium de alta calidad', TRUE, TRUE)
ON CONFLICT (sku) DO NOTHING
""")

print("[v0] Inserted base items")

# Insert variant items
sql("""
INSERT INTO items (sku, titulo, marca, has_variants, is_container) VALUES
('VINO-TRAPICHE-MALBEC-2020', 'Vino Trapiche Gran Medalla Malbec 2020', 'Trapiche', FALSE, FALSE),
('VINO-TRAPICHE-MALBEC-2021', 'Vino Trapiche Gran Medalla Malbec 2021', 'Trapiche', FALSE, FALSE)
ON CONFLICT (sku) DO NOTHING
""")

print("[v0] Inserted variant items")

# Insert variant relationships
sql("""
INSERT INTO variants (parent_sku, variant_sku) VALUES
('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2020'),
('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2021')
ON CONFLICT DO NOTHING
""")

print("[v0] Inserted variant relationships")

# Insert some initial stock
sql("""
INSERT INTO stock (item_sku, deposito, cantidad) VALUES
('ITEM-SIN-ATRIBUTOS-1', 'Deposito Central', 100),
('VINO-TRAPICHE-MALBEC-2020', 'Deposito Central', 50),
('VINO-TRAPICHE-MALBEC-2021', 'Deposito Central', 75)
ON CONFLICT (item_sku, deposito) DO NOTHING
""")

print("[v0] Inserted initial stock")

print("[v0] ✅ Database seeded successfully!")
