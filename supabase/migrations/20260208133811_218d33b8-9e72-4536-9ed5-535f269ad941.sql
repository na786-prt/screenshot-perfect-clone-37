-- =============================================
-- RASI Game Platform - Database Schema
-- =============================================

-- 1. Create custom types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.bet_type AS ENUM ('single', 'double', 'triple');
CREATE TYPE public.bet_status AS ENUM ('pending', 'won', 'lost', 'cancelled');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'bet_placed', 'bet_won', 'bet_refund');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.payment_request_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  mobile TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create lotteries table
CREATE TABLE public.lotteries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  draw_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  single_digit_price DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  single_digit_win_amount DECIMAL(10, 2) NOT NULL DEFAULT 90.00,
  double_digit_price DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  double_digit_win_amount DECIMAL(10, 2) NOT NULL DEFAULT 900.00,
  triple_digit_price DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  triple_digit_win_amount DECIMAL(10, 2) NOT NULL DEFAULT 9000.00,
  triple_box_price DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  triple_box_win_amount DECIMAL(10, 2) NOT NULL DEFAULT 1500.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create lottery_results table
CREATE TABLE public.lottery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID REFERENCES public.lotteries(id) ON DELETE CASCADE NOT NULL,
  winning_number TEXT NOT NULL, -- 3-digit number like "123"
  digit_a TEXT NOT NULL, -- First digit
  digit_b TEXT NOT NULL, -- Second digit
  digit_c TEXT NOT NULL, -- Third digit
  result_declared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE (lottery_id)
);

-- 7. Create bets table
CREATE TABLE public.bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lottery_id UUID REFERENCES public.lotteries(id) ON DELETE CASCADE NOT NULL,
  bet_type bet_type NOT NULL,
  position TEXT, -- 'A', 'B', 'C' for single; 'AB', 'BC', 'AC' for double; null for triple
  selected_number TEXT NOT NULL, -- The number user bet on
  is_box BOOLEAN NOT NULL DEFAULT false, -- For triple digit BOX option
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  potential_win_amount DECIMAL(10, 2) NOT NULL,
  status bet_status NOT NULL DEFAULT 'pending',
  win_amount DECIMAL(10, 2) DEFAULT 0.00,
  placed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- 8. Create payment_requests table (for UPI deposits/withdrawals)
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount DECIMAL(12, 2) NOT NULL,
  upi_reference TEXT, -- UTR number for deposits
  upi_id TEXT, -- User's UPI ID for withdrawals
  status payment_request_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- 9. Create transactions table (wallet history)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  reference_id UUID, -- bet_id or payment_request_id
  description TEXT,
  status transaction_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- SECURITY FUNCTIONS
-- =============================================

-- Function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- =============================================
-- TRIGGER FUNCTIONS
-- =============================================

-- Auto-create profile and wallet when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lotteries_updated_at
  BEFORE UPDATE ON public.lotteries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lottery_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- USER_ROLES policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_admin());

-- PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- WALLETS policies
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (public.is_admin());

-- LOTTERIES policies (all users can view active lotteries)
CREATE POLICY "Anyone can view active lotteries"
  ON public.lotteries FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lotteries"
  ON public.lotteries FOR ALL
  USING (public.is_admin());

-- LOTTERY_RESULTS policies
CREATE POLICY "Anyone can view lottery results"
  ON public.lottery_results FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage lottery results"
  ON public.lottery_results FOR ALL
  USING (public.is_admin());

-- BETS policies
CREATE POLICY "Users can view their own bets"
  ON public.bets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bets"
  ON public.bets FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can place bets"
  ON public.bets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PAYMENT_REQUESTS policies
CREATE POLICY "Users can view their own payment requests"
  ON public.payment_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment requests"
  ON public.payment_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can create payment requests"
  ON public.payment_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payment requests"
  ON public.payment_requests FOR UPDATE
  USING (public.is_admin());

-- TRANSACTIONS policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.is_admin());

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_bets_user_id ON public.bets(user_id);
CREATE INDEX idx_bets_lottery_id ON public.bets(lottery_id);
CREATE INDEX idx_bets_status ON public.bets(status);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);
CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_lotteries_draw_time ON public.lotteries(draw_time);
CREATE INDEX idx_lotteries_is_active ON public.lotteries(is_active);