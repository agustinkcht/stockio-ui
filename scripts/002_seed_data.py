import os
from neondb_toolkit import create_sql_client

# Get database connection
sql = create_sql_client(os.environ.get('NEON_NEON_DATABASE_URL'))

print("Seeding initial items...")
sql("""
INSERT INTO items (sku, titulo, marca, descripcion, has_variants, is_container) VALUES
('ITEM-SIN-ATRIBUTOS-1', 'Item Sin Atributos 1', 'Marca Ejemplo', 'Descripción del item sin atributos', FALSE, FALSE),
('VINO-TRAPICHE-GRAN-MEDALLA', 'Vino Trapiche Gran Medalla', 'Trapiche', 'Vino premium de alta calidad', TRUE, TRUE)
ON CONFLICT (sku) DO NOTHING
""")

print("Seeding variant items...")
sql("""
INSERT INTO items (sku, titulo, marca, has_variants, is_container) VALUES
('VINO-TRAPICHE-MALBEC-2020', 'Vino Trapiche Gran Medalla Malbec 2020', 'Trapiche', FALSE, FALSE),
('VINO-TRAPICHE-MALBEC-2021', 'Vino Trapiche Gran Medalla Malbec 2021', 'Trapiche', FALSE, FALSE)
ON CONFLICT (sku) DO NOTHING
""")

print("Creating variant relationships...")
sql("""
INSERT INTO variants (parent_sku, variant_sku) VALUES
('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2020'),
('VINO-TRAPICHE-GRAN-MEDALLA', 'VINO-TRAPICHE-MALBEC-2021')
ON CONFLICT DO NOTHING
""")

print("✅ Initial data seeded successfully!")
