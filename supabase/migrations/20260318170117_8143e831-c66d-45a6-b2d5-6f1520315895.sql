-- Fix overly permissive notifications insert policy
DROP POLICY "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE id = user_id));

-- Also allow admins to update profiles (for faculty approval)
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));