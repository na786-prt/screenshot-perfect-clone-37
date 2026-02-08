import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLotteries() {
  const { data: lotteries, isLoading, error, refetch } = useQuery({
    queryKey: ['lotteries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotteries')
        .select('*')
        .eq('is_active', true)
        .gte('draw_time', new Date().toISOString())
        .order('draw_time', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  return {
    lotteries: lotteries ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useLottery(lotteryId: string | null) {
  const { data: lottery, isLoading, error } = useQuery({
    queryKey: ['lottery', lotteryId],
    queryFn: async () => {
      if (!lotteryId) return null;

      const { data, error } = await supabase
        .from('lotteries')
        .select('*')
        .eq('id', lotteryId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!lotteryId,
  });

  return {
    lottery,
    isLoading,
    error,
  };
}
