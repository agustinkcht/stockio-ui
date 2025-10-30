-- Insert initial items
INSERT INTO items (sku, name, codigo_universal, marca, proveedor, codigo_proveedor, has_variants, is_agrupador, formato_venta, volumen_active, volumen_cantidad, volumen_unidad)
VALUES 
  ('aB12cD34e56', 'Item Sin Atributos 1', '7501234567890', '', '', '', FALSE, FALSE, NULL, FALSE, NULL, NULL),
  ('VINO-TRAPI', 'Vino Trapiche Gran Medalla', '', 'Trapiche', 'Grupo Peñaflor', '', TRUE, TRUE, 'unidad', TRUE, 750, 'ml')
ON CONFLICT (sku) DO NOTHING;

-- Insert stock for Item Sin Atributos 1
INSERT INTO stock (sku, total, reservado, disponible, deposito)
VALUES ('aB12cD34e56', 45, 8, 37, 'principal')
ON CONFLICT (sku, deposito) DO UPDATE SET
  total = EXCLUDED.total,
  reservado = EXCLUDED.reservado,
  disponible = EXCLUDED.disponible;

-- Insert container atributos principales for Vino Trapiche
INSERT INTO container_atributos_principales (sku, key, variantes)
VALUES 
  ('VINO-TRAPI', 'Varietal', ARRAY['Malbec', 'Cabernet Sauvignon', 'Cabernet Franc', 'Pinot Noir', 'Chardonnay']),
  ('VINO-TRAPI', 'Año', ARRAY['2014', '2020'])
ON CONFLICT DO NOTHING;

-- Insert atributos informativos for Vino Trapiche
INSERT INTO atributos_informativos (sku, key, value)
VALUES 
  ('VINO-TRAPI', 'Tipo de Vino', ''),
  ('VINO-TRAPI', 'Bodega', 'Trapiche'),
  ('VINO-TRAPI', 'Origen', 'Valle de Uco, Mendoza'),
  ('VINO-TRAPI', 'Tiempo en Barrica', ''),
  ('VINO-TRAPI', 'Potencial de Guarda', '10 años'),
  ('VINO-TRAPI', 'Enólogo', 'Daniel Pi')
ON CONFLICT DO NOTHING;

-- Insert variants for Vino Trapiche
INSERT INTO item_variants (parent_sku, sku, name)
VALUES 
  ('VINO-TRAPI', 'VINO-TRAPI-malbec-2014', 'Vino Trapiche Gran Medalla Malbec 2014'),
  ('VINO-TRAPI', 'VINO-TRAPI-malbec-2020', 'Vino Trapiche Gran Medalla Malbec 2020'),
  ('VINO-TRAPI', 'VINO-TRAPI-cabernet-sauvignon-2014', 'Vino Trapiche Gran Medalla Cabernet Sauvignon 2014'),
  ('VINO-TRAPI', 'VINO-TRAPI-cabernet-sauvignon-2020', 'Vino Trapiche Gran Medalla Cabernet Sauvignon 2020'),
  ('VINO-TRAPI', 'VINO-TRAPI-cabernet-franc-2014', 'Vino Trapiche Gran Medalla Cabernet Franc 2014'),
  ('VINO-TRAPI', 'VINO-TRAPI-cabernet-franc-2020', 'Vino Trapiche Gran Medalla Cabernet Franc 2020'),
  ('VINO-TRAPI', 'VINO-TRAPI-pinot-noir-2014', 'Vino Trapiche Gran Medalla Pinot Noir 2014'),
  ('VINO-TRAPI', 'VINO-TRAPI-pinot-noir-2020', 'Vino Trapiche Gran Medalla Pinot Noir 2020'),
  ('VINO-TRAPI', 'VINO-TRAPI-chardonnay-2014', 'Vino Trapiche Gran Medalla Chardonnay 2014'),
  ('VINO-TRAPI', 'VINO-TRAPI-chardonnay-2020', 'Vino Trapiche Gran Medalla Chardonnay 2020')
ON CONFLICT (sku) DO NOTHING;

-- Insert variant atributos principales
INSERT INTO variant_atributos_principales (variant_sku, key, value)
VALUES 
  ('VINO-TRAPI-malbec-2014', 'Varietal', 'Malbec'),
  ('VINO-TRAPI-malbec-2014', 'Año', '2014'),
  ('VINO-TRAPI-malbec-2020', 'Varietal', 'Malbec'),
  ('VINO-TRAPI-malbec-2020', 'Año', '2020'),
  ('VINO-TRAPI-cabernet-sauvignon-2014', 'Varietal', 'Cabernet Sauvignon'),
  ('VINO-TRAPI-cabernet-sauvignon-2014', 'Año', '2014'),
  ('VINO-TRAPI-cabernet-sauvignon-2020', 'Varietal', 'Cabernet Sauvignon'),
  ('VINO-TRAPI-cabernet-sauvignon-2020', 'Año', '2020'),
  ('VINO-TRAPI-cabernet-franc-2014', 'Varietal', 'Cabernet Franc'),
  ('VINO-TRAPI-cabernet-franc-2014', 'Año', '2014'),
  ('VINO-TRAPI-cabernet-franc-2020', 'Varietal', 'Cabernet Franc'),
  ('VINO-TRAPI-cabernet-franc-2020', 'Año', '2020'),
  ('VINO-TRAPI-pinot-noir-2014', 'Varietal', 'Pinot Noir'),
  ('VINO-TRAPI-pinot-noir-2014', 'Año', '2014'),
  ('VINO-TRAPI-pinot-noir-2020', 'Varietal', 'Pinot Noir'),
  ('VINO-TRAPI-pinot-noir-2020', 'Año', '2020'),
  ('VINO-TRAPI-chardonnay-2014', 'Varietal', 'Chardonnay'),
  ('VINO-TRAPI-chardonnay-2014', 'Año', '2014'),
  ('VINO-TRAPI-chardonnay-2020', 'Varietal', 'Chardonnay'),
  ('VINO-TRAPI-chardonnay-2020', 'Año', '2020')
ON CONFLICT DO NOTHING;

-- Insert stock for variants
INSERT INTO stock (sku, total, reservado, disponible, deposito)
VALUES 
  ('VINO-TRAPI-malbec-2014', 45, 12, 33, 'principal'),
  ('VINO-TRAPI-malbec-2020', 38, 8, 30, 'principal'),
  ('VINO-TRAPI-cabernet-sauvignon-2014', 52, 15, 37, 'principal'),
  ('VINO-TRAPI-cabernet-sauvignon-2020', 29, 6, 23, 'principal'),
  ('VINO-TRAPI-cabernet-franc-2014', 31, 7, 24, 'principal'),
  ('VINO-TRAPI-cabernet-franc-2020', 22, 4, 18, 'principal'),
  ('VINO-TRAPI-pinot-noir-2014', 18, 3, 15, 'principal'),
  ('VINO-TRAPI-pinot-noir-2020', 25, 5, 20, 'principal'),
  ('VINO-TRAPI-chardonnay-2014', 35, 9, 26, 'principal'),
  ('VINO-TRAPI-chardonnay-2020', 41, 11, 30, 'principal')
ON CONFLICT (sku, deposito) DO UPDATE SET
  total = EXCLUDED.total,
  reservado = EXCLUDED.reservado,
  disponible = EXCLUDED.disponible;

-- Update variant count for parent item
UPDATE items SET variant_count = 10 WHERE sku = 'VINO-TRAPI';
