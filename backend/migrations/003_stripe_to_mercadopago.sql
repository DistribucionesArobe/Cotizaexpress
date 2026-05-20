-- Migración: Stripe → Mercado Pago
-- Fecha: 2026-05-20
-- Descripción: Reemplaza columnas de Stripe con Mercado Pago

-- 1. Agregar nueva columna para Mercado Pago
ALTER TABLE companies ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- 2. Copiar datos existentes de stripe a mp (por si hay clientes que ya pagaron)
UPDATE companies SET mp_payment_id = stripe_customer_id WHERE stripe_customer_id IS NOT NULL;

-- 3. Eliminar columna vieja de Stripe (opcional - descomentar cuando estés seguro)
-- ALTER TABLE companies DROP COLUMN IF EXISTS stripe_customer_id;

-- Verificar
SELECT id, name, plan_code, mp_payment_id FROM companies WHERE mp_payment_id IS NOT NULL;
