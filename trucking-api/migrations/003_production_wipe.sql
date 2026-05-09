-- ════════════════════════════════════════════════════════════════════════════════
-- PRODUCTION DATA CLEANUP SCRIPT (V2 - SAFE MODE)
-- This script uses DO blocks to silently handle non-existent tables.
-- ════════════════════════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    t_name text;
    tables_to_wipe text[] := ARRAY[
        'bids', 'bookings', 'trips', 'tracking_logs', 'notifications', 
        'messages', 'wallet_transactions', 'commissions', 'disputes', 
        'ratings', 'documents', 'truck_documents', 'trucks', 'geofences', 'coupons'
    ];
BEGIN
    FOREACH t_name IN ARRAY tables_to_wipe
    LOOP
        BEGIN
            EXECUTE format('DELETE FROM %I', t_name);
            RAISE NOTICE 'Wiped table: %', t_name;
        EXCEPTION WHEN undefined_table THEN
            RAISE NOTICE 'Skipping non-existent table: %', t_name;
        END;
    END LOOP;
END $$;

-- 2. Audit Logs Clean (Keep password reset records for security)
DELETE FROM audit_logs WHERE action != 'PASSWORD_RESET_OTP';

-- 3. Delete all users EXCEPT the primary admin
-- Replace 'admin@test.com' with your actual admin email if different
DELETE FROM users 
WHERE email NOT IN ('admin@test.com', 'abdullah@truckapp.pk') 
  AND role != 'admin';

-- Final Verification
SELECT 'Users' as table_name, count(*) FROM users
UNION ALL
SELECT 'Trucks', count(*) FROM trucks
UNION ALL
SELECT 'Bookings', count(*) FROM bookings;
