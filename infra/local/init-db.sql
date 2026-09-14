-- Synthetic local credentials only. Database owner is the separate migration role.
CREATE ROLE dealith_app LOGIN PASSWORD 'dealith_app_local'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
