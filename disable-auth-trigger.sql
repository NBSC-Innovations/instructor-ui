-- Disable the auth trigger temporarily to allow signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
