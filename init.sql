-- ============================================
-- Script de inicialización con datos de prueba
-- Chiper API - Sistema de Inventario
-- ============================================

-- Este script se ejecuta automáticamente al iniciar el contenedor MySQL
-- Inserta datos de prueba para productos, tiendas, monedas y transacciones

-- NOTA: TypeORM creará las tablas automáticamente con synchronize: true
-- Este script debe esperar a que las tablas existan antes de insertar datos
-- Para ello, usamos un procedimiento que reintenta la inserción

DELIMITER $$

CREATE PROCEDURE InsertTestData()
BEGIN
    DECLARE table_exists INT DEFAULT 0;
    DECLARE retry_count INT DEFAULT 0;
    DECLARE max_retries INT DEFAULT 30;
    
    -- Esperar hasta que la tabla items_inventario exista
    WHILE table_exists = 0 AND retry_count < max_retries DO
        SELECT COUNT(*) INTO table_exists
        FROM information_schema.tables 
        WHERE table_schema = 'chiper' 
        AND table_name = 'items_inventario';
        
        IF table_exists = 0 THEN
            SET retry_count = retry_count + 1;
            SELECT CONCAT('Esperando a que TypeORM cree las tablas... Intento ', retry_count, '/', max_retries) AS message;
            DO SLEEP(2);
        END IF;
    END WHILE;
    
    IF table_exists = 1 THEN
        -- ============================================
        -- Datos de prueba para Items de Inventario
        -- ============================================
        
        INSERT INTO items_inventario (id, productoId, tiendaId, cantidad, precioVenta, monedaId, createdAt, updatedAt) VALUES
        -- Producto 1 en Tienda 1
        ('11111111-1111-1111-1111-111111111111', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         100, 
         25.50, 
         'cccccccc-cccc-cccc-cccc-cccccccccccc', 
         NOW(), 
         NOW()),
        
        -- Producto 2 en Tienda 1
        ('22222222-2222-2222-2222-222222222222', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         50, 
         15.75, 
         'cccccccc-cccc-cccc-cccc-cccccccccccc', 
         NOW(), 
         NOW()),
        
        -- Producto 1 en Tienda 2
        ('33333333-3333-3333-3333-333333333333', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 
         75, 
         27.00, 
         'cccccccc-cccc-cccc-cccc-cccccccccccc', 
         NOW(), 
         NOW()),
        
        -- Producto 3 en Tienda 1
        ('44444444-4444-4444-4444-444444444444', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         200, 
         10.00, 
         'cccccccc-cccc-cccc-cccc-cccccccccccc', 
         NOW(), 
         NOW()),
        
        -- Producto 4 en Tienda 2
        ('55555555-5555-5555-5555-555555555555', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 
         150, 
         45.99, 
         'cccccccc-cccc-cccc-cccc-cccccccccccc', 
         NOW(), 
         NOW());
        
        -- ============================================
        -- Datos de prueba para Registros de Compra
        -- ============================================
        
        INSERT INTO registros_compra_producto_tienda (id, tiendaId, productoId, compraId, itemInventarioId, fechaCompra, cantidad, createdAt, updatedAt) VALUES
        -- Compras para el item 1
        ('c1111111-1111-1111-1111-111111111111', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'dddddddd-dddd-dddd-dddd-dddddddddddd', 
         '11111111-1111-1111-1111-111111111111', 
         '2026-01-15 10:30:00', 
         50, 
         NOW(), 
         NOW()),
        
        -- Otra compra para el item 1
        ('c2222222-2222-2222-2222-222222222222', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'dddddddd-dddd-dddd-dddd-ddddddddddde', 
         '11111111-1111-1111-1111-111111111111', 
         '2026-01-20 14:15:00', 
         50, 
         NOW(), 
         NOW()),
        
        -- Compra para el item 2
        ('c3333333-3333-3333-3333-333333333333', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 
         'dddddddd-dddd-dddd-dddd-dddddddddddf', 
         '22222222-2222-2222-2222-222222222222', 
         '2026-01-18 09:00:00', 
         50, 
         NOW(), 
         NOW()),
        
        -- Compra para el item 3
        ('c4444444-4444-4444-4444-444444444444', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'dddddddd-dddd-dddd-dddd-ddddddddddda', 
         '33333333-3333-3333-3333-333333333333', 
         '2026-01-22 11:45:00', 
         75, 
         NOW(), 
         NOW()),
        
        -- Compra para el item 4
        ('c5555555-5555-5555-5555-555555555555', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 
         'dddddddd-dddd-dddd-dddd-dddddddddddb', 
         '44444444-4444-4444-4444-444444444444', 
         '2026-01-25 16:20:00', 
         200, 
         NOW(), 
         NOW());
        
        -- ============================================
        -- Datos de prueba para Registros de Venta
        -- ============================================
        
        INSERT INTO registros_venta_producto_tienda (id, tiendaId, productoId, ventaId, itemInventarioId, fechaVenta, cantidad, createdAt, updatedAt) VALUES
        -- Ventas para el item 1
        ('v1111111-1111-1111-1111-111111111111', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 
         '11111111-1111-1111-1111-111111111111', 
         '2026-01-28 10:30:00', 
         10, 
         NOW(), 
         NOW()),
        
        ('v2222222-2222-2222-2222-222222222222', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', 
         '11111111-1111-1111-1111-111111111111', 
         '2026-01-29 15:45:00', 
         15, 
         NOW(), 
         NOW()),
        
        -- Venta para el item 2
        ('v3333333-3333-3333-3333-333333333333', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee0', 
         '22222222-2222-2222-2222-222222222222', 
         '2026-01-30 12:00:00', 
         5, 
         NOW(), 
         NOW()),
        
        -- Venta para el item 3
        ('v4444444-4444-4444-4444-444444444444', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 
         '33333333-3333-3333-3333-333333333333', 
         '2026-01-31 09:30:00', 
         20, 
         NOW(), 
         NOW()),
        
        -- Venta para el item 4
        ('v5555555-5555-5555-5555-555555555555', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 
         '44444444-4444-4444-4444-444444444444', 
         '2026-02-01 14:20:00', 
         25, 
         NOW(), 
         NOW()),
        
        -- Más ventas para el item 5
        ('v6666666-6666-6666-6666-666666666666', 
         'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', 
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', 
         'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 
         '55555555-5555-5555-5555-555555555555', 
         '2026-02-02 11:15:00', 
         10, 
         NOW(), 
         NOW());
        
        SELECT '✅ Datos de prueba insertados correctamente' AS message;
    ELSE
        SELECT '❌ Error: Las tablas no fueron creadas por TypeORM después de esperar' AS message;
    END IF;
END$$

DELIMITER ;

-- Ejecutar el procedimiento
CALL InsertTestData();

-- Limpiar
DROP PROCEDURE InsertTestData;

-- ============================================
-- Resumen de datos insertados
-- ============================================
-- 
-- ITEMS DE INVENTARIO: 5 registros
-- - Producto aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa en Tienda bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (100 unidades)
-- - Producto aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab en Tienda bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (50 unidades)
-- - Producto aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa en Tienda bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc (75 unidades)
-- - Producto aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac en Tienda bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (200 unidades)
-- - Producto aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad en Tienda bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc (150 unidades)
--
-- REGISTROS DE COMPRA: 5 registros
-- REGISTROS DE VENTA: 6 registros
--
-- Moneda utilizada: cccccccc-cccc-cccc-cccc-cccccccccccc
-- 
-- ============================================
