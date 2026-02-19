-- Allow admins to update bets (for settling results)
CREATE POLICY "Admins can update bets"
ON public.bets
FOR UPDATE
TO authenticated
USING (public.is_admin());
