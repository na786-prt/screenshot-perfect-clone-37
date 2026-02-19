import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-payment-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('payment_requests').select('*').order('requested_at', { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleApprove = async (request: any) => {
    if (processingId) return;
    setProcessingId(request.id);
    try {
      const { error: updateErr } = await supabase.from('payment_requests').update({ status: 'approved', processed_by: user?.id, processed_at: new Date().toISOString() }).eq('id', request.id);
      if (updateErr) throw updateErr;

      const { data: wallet, error: walletErr } = await supabase.from('wallets').select('balance').eq('user_id', request.user_id).single();
      if (walletErr || !wallet) throw new Error('Wallet not found');

      const newBalance = Number(wallet.balance) + (request.type === 'deposit' ? Number(request.amount) : -Number(request.amount));

      const { error: walletUpdateErr } = await supabase.from('wallets').update({ balance: newBalance }).eq('user_id', request.user_id);
      if (walletUpdateErr) throw walletUpdateErr;

      const { error: txErr } = await supabase.from('transactions').insert({
        user_id: request.user_id,
        type: request.type === 'deposit' ? 'deposit' : 'withdrawal',
        amount: Number(request.amount),
        balance_after: newBalance,
        reference_id: request.id,
        description: `${request.type} approved by admin`,
      });
      if (txErr) throw txErr;

      toast({ title: 'Request Approved', description: `₹${request.amount} ${request.type} approved.` });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: any) => {
    if (processingId) return;
    setProcessingId(request.id);
    try {
      const { error } = await supabase.from('payment_requests').update({ status: 'rejected', processed_by: user?.id, processed_at: new Date().toISOString() }).eq('id', request.id);
      if (error) throw error;
      toast({ title: 'Request Rejected' });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-requests'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setProcessingId(null);
    }
  };

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const processedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payment Requests</h1>
      <Card>
        <CardHeader><CardTitle>Pending ({pendingRequests.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : pendingRequests.length === 0 ? <p className="text-center text-muted-foreground py-4">No pending requests</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Reference</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {pendingRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                    <TableCell className="font-semibold">₹{Number(r.amount).toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm">{r.upi_reference || r.upi_id || '-'}</TableCell>
                    <TableCell className="text-sm">{format(new Date(r.requested_at), 'MMM d, h:mm a')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-success hover:bg-success/90" disabled={!!processingId} onClick={() => handleApprove(r)}>
                          {processingId === r.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}Approve
                        </Button>
                        <Button size="sm" variant="destructive" disabled={!!processingId} onClick={() => handleReject(r)}>
                          {processingId === r.id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Processed</CardTitle></CardHeader>
        <CardContent>
          {processedRequests.length === 0 ? <p className="text-center text-muted-foreground py-4">No processed requests</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Processed</TableHead></TableRow></TableHeader>
              <TableBody>
                {processedRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline" className="capitalize">{r.type}</Badge></TableCell>
                    <TableCell className="font-semibold">₹{Number(r.amount).toFixed(2)}</TableCell>
                    <TableCell><Badge className={r.status === 'approved' ? 'bg-success' : ''} variant={r.status === 'rejected' ? 'destructive' : 'default'}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm">{r.processed_at ? format(new Date(r.processed_at), 'MMM d, h:mm a') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
