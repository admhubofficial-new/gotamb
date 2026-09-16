# goTamb Supabase remote schema

Production/test project used by the mobile app:

- Project ref: `zgxhgjtzzqzpycrrdptm`
- API URL: `https://zgxhgjtzzqzpycrrdptm.supabase.co`
- Frontend schema contract: `src/types/database.ts`

Applied remote migrations as of 2026-09-16:

1. `20260915143022_add_vendor_map_profile_fields`
2. `20260915144042_support_demo_vendor_map_data`
3. `20260915144310_secure_internal_rls_trigger_and_index_marketplace`
4. `20260915145119_extend_customer_order_delivery_fields`
5. `20260915150059_add_order_delivery_coordinates`
6. `20260915151048_add_fleet_assignment_and_route_tracking`
7. `20260915151430_add_driver_live_location_tracking`
8. `20260915151500_allow_driver_registration`
9. `20260915151731_add_vendor_driver_assignment_rpcs`

Current public tables:

- `profiles`
- `vendors`
- `items`
- `fleets`
- `orders`

Current public RPCs:

- `assign_driver_to_fleet`
- `list_available_drivers`
- `update_driver_location`

The application client is intentionally pinned to this project in `lib/supabase.js`, so local, GitHub Actions, and APK builds use the same backend even if an old `.env` file exists locally.
