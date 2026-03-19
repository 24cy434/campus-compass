
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    CASE 
      WHEN NEW.email IN ('asharaj@mgits.ac.in', 'adhithyakrishna00001@gmail.com') THEN 'admin'
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'faculty' THEN 'faculty'
      ELSE 'student'
    END,
    CASE 
      WHEN NEW.email IN ('asharaj@mgits.ac.in', 'adhithyakrishna00001@gmail.com') THEN 'approved'
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'student') = 'faculty' THEN 'pending'
      ELSE 'approved'
    END
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
