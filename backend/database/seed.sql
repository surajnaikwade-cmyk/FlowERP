-- FlowERP Seed Data

-- USERS
INSERT INTO users
(name, email, password, role)
VALUES
(
    'Demo Admin',
    'admin@example.com',
    '$2b$10$SpeWXHaHTWUVReZtyXe21.3gONqDhFT1Wb.VSTn5ktPGVfbmoJqVe',
    'ADMIN'
),
(
    'Demo Sales User',
    'sales@example.com',
    '$2b$10$A/wL27NS6zVQN.5aajw6lu.x4IHSCIuoKqhCJtmybllqk/Tu/XQEa',
    'SALES_USER'
);

-- CUSTOMERS
INSERT INTO customers
(company_name, contact_person, mobile, email, city)
VALUES
('Sample Engineering Ltd.', 'Demo Contact', '9000000001', 'contact1@example.com', 'Mumbai'),
('Sample Industrial Solutions', 'Demo Contact', '9000000002', 'contact2@example.com', 'Pune'),
('Sample Manufacturing Co.', 'Demo Contact', '9000000003', 'contact3@example.com', 'Nashik');

-- INDUSTRIAL PRODUCTS
INSERT INTO products
(product_code, product_name, category, unit, base_price)
VALUES
('IND001', 'Industrial Electric Motor 5 HP', 'Power Equipment', 'Piece', 48500.00),
('IND002', 'Heavy Duty Conveyor Belt 10m', 'Material Handling', 'Piece', 32500.00),
('IND003', 'Hydraulic Pressure Pump 20MPa', 'Hydraulics', 'Piece', 42000.00),
('IND004', 'Stainless Steel Control Panel', 'Electrical', 'Piece', 28500.00),
('IND005', 'Industrial Air Compressor 10 HP', 'Compressed Air', 'Piece', 76500.00),
('IND006', 'Precision Bearing Assembly', 'Mechanical Components', 'Piece', 6800.00);

-- INVENTORY
INSERT INTO inventory
(product_id, physical_quantity, reserved_quantity)
VALUES
(1, 100, 20),
(2, 80, 10),
(3, 60, 5),
(4, 75, 8),
(5, 40, 4),
(6, 200, 25);
