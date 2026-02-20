
-- Allow admins to insert transactions for any user
CREATE POLICY "Admins can insert transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Allow admins to update any wallet balance
CREATE POLICY "Admins can update wallets"
ON public.wallets
FOR UPDATE
TO authenticated
USING (public.is_admin());
