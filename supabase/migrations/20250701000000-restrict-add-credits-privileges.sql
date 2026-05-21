-- Revoke execution of add_credits from public, anon, and authenticated roles to ensure it can only be called by the backend service role.
REVOKE EXECUTE ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- Grant execution exclusively to service_role
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT) TO service_role;
