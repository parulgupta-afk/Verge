-- Seed starter road segments for Delhi + Bangalore
-- Run AFTER 001_initial_schema.sql

INSERT INTO road_segments (name, road_code, city, geometry, status, confidence, confirms, refutes, metadata)
VALUES
  (
    'Outer Ring Road (South)',
    'ORR-S',
    'Delhi',
    ST_GeogFromText('LINESTRING(77.2000 28.5450, 77.2200 28.5450, 77.2400 28.5500, 77.2600 28.5550)'),
    'blocked', 92, 14, 1,
    '{"description": "Waterlogging near IIT Gate after heavy rain."}'::jsonb
  ),
  (
    'NH-48 (Gurgaon stretch)',
    'NH-48',
    'Delhi',
    ST_GeogFromText('LINESTRING(77.0700 28.4600, 77.0900 28.4700, 77.1100 28.4800, 77.1300 28.4900)'),
    'partial', 71, 8, 3,
    '{"description": "Slow traffic due to metro construction."}'::jsonb
  ),
  (
    'MG Road',
    'MG',
    'Delhi',
    ST_GeogFromText('LINESTRING(77.2000 28.6300, 77.2200 28.6300, 77.2400 28.6280)'),
    'clear', 88, 11, 0,
    '{"description": "Clear after morning peak."}'::jsonb
  ),
  (
    'ITO Crossing approaches',
    'ITO',
    'Delhi',
    ST_GeogFromText('LINESTRING(77.2400 28.6250, 77.2500 28.6280, 77.2600 28.6300)'),
    'partial', 65, 6, 2,
    '{"description": "Congestion due to temporary diversions."}'::jsonb
  ),
  (
    'Outer Ring Road (ORR) – Bellandur',
    'ORR-BLR',
    'Bangalore',
    ST_GeogFromText('LINESTRING(77.6600 12.9300, 77.6800 12.9350, 77.7000 12.9400, 77.7200 12.9450)'),
    'blocked', 89, 19, 2,
    '{"description": "Major waterlogging near Bellandur lake."}'::jsonb
  ),
  (
    'Hosur Road',
    'Hosur',
    'Bangalore',
    ST_GeogFromText('LINESTRING(77.6000 12.9000, 77.6200 12.9100, 77.6400 12.9200)'),
    'partial', 58, 5, 3,
    '{"description": "Construction work, one lane closed."}'::jsonb
  ),
  (
    'Airport Road (Old)',
    'AIRPORT',
    'Bangalore',
    ST_GeogFromText('LINESTRING(77.6000 13.0000, 77.6200 13.0200, 77.6400 13.0400)'),
    'clear', 81, 9, 1,
    '{"description": "Moving well."}'::jsonb
  ),
  (
    'MG Road – Brigade',
    'MG-BLR',
    'Bangalore',
    ST_GeogFromText('LINESTRING(77.6000 12.9750, 77.6100 12.9750, 77.6200 12.9760)'),
    'unknown', 0, 0, 0,
    '{"description": "No recent reports."}'::jsonb
  );
