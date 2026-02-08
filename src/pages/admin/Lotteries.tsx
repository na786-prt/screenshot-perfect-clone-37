import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Plus, Edit, Loader2 } from 'lucide-react';

export default function AdminLotteries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLottery, setEditingLottery] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    draw_time: '',
    is_active: true,
    single_digit_price: '10',
    single_digit_win_amount: '90',
    double_digit_price: '10',
    double_digit_win_amount: '900',
    triple_digit_price: '10',
    triple_digit_win_amount: '9000',
    triple_box_price: '10',
    triple_box_win_amount: '1500',
  });

  const { data: lotteries, isLoading } = useQuery({
    queryKey: ['admin-lotteries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lotteries')
        .select('*')
        .order('draw_time', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      draw_time: '',
      is_active: true,
      single_digit_price: '10',
      single_digit_win_amount: '90',
      double_digit_price: '10',
      double_digit_win_amount: '900',
      triple_digit_price: '10',
      triple_digit_win_amount: '9000',
      triple_box_price: '10',
      triple_box_win_amount: '1500',
    });
    setEditingLottery(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (lottery: any) => {
    setEditingLottery(lottery);
    setFormData({
      name: lottery.name,
      description: lottery.description || '',
      draw_time: lottery.draw_time.slice(0, 16),
      is_active: lottery.is_active,
      single_digit_price: String(lottery.single_digit_price),
      single_digit_win_amount: String(lottery.single_digit_win_amount),
      double_digit_price: String(lottery.double_digit_price),
      double_digit_win_amount: String(lottery.double_digit_win_amount),
      triple_digit_price: String(lottery.triple_digit_price),
      triple_digit_win_amount: String(lottery.triple_digit_win_amount),
      triple_box_price: String(lottery.triple_box_price),
      triple_box_win_amount: String(lottery.triple_box_win_amount),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.draw_time) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Name and draw time are required',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        draw_time: new Date(formData.draw_time).toISOString(),
        is_active: formData.is_active,
        single_digit_price: parseFloat(formData.single_digit_price),
        single_digit_win_amount: parseFloat(formData.single_digit_win_amount),
        double_digit_price: parseFloat(formData.double_digit_price),
        double_digit_win_amount: parseFloat(formData.double_digit_win_amount),
        triple_digit_price: parseFloat(formData.triple_digit_price),
        triple_digit_win_amount: parseFloat(formData.triple_digit_win_amount),
        triple_box_price: parseFloat(formData.triple_box_price),
        triple_box_win_amount: parseFloat(formData.triple_box_win_amount),
      };

      if (editingLottery) {
        const { error } = await supabase
          .from('lotteries')
          .update(payload)
          .eq('id', editingLottery.id);
        if (error) throw error;
        toast({ title: 'Lottery Updated' });
      } else {
        const { error } = await supabase
          .from('lotteries')
          .insert(payload);
        if (error) throw error;
        toast({ title: 'Lottery Created' });
      }

      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['admin-lotteries'] });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lotteries</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lottery
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLottery ? 'Edit Lottery' : 'Create New Lottery'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Kerala Lottery"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Draw Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.draw_time}
                    onChange={(e) => setFormData({ ...formData, draw_time: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>

              <hr />

              <h3 className="font-semibold">Single Digit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.single_digit_price}
                    onChange={(e) => setFormData({ ...formData, single_digit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Win Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.single_digit_win_amount}
                    onChange={(e) => setFormData({ ...formData, single_digit_win_amount: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="font-semibold">Double Digit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.double_digit_price}
                    onChange={(e) => setFormData({ ...formData, double_digit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Win Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.double_digit_win_amount}
                    onChange={(e) => setFormData({ ...formData, double_digit_win_amount: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="font-semibold">Triple Digit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.triple_digit_price}
                    onChange={(e) => setFormData({ ...formData, triple_digit_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Win Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.triple_digit_win_amount}
                    onChange={(e) => setFormData({ ...formData, triple_digit_win_amount: e.target.value })}
                  />
                </div>
              </div>

              <h3 className="font-semibold">Triple BOX</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.triple_box_price}
                    onChange={(e) => setFormData({ ...formData, triple_box_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Win Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.triple_box_win_amount}
                    onChange={(e) => setFormData({ ...formData, triple_box_win_amount: e.target.value })}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingLottery ? 'Update Lottery' : 'Create Lottery'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : lotteries?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No lotteries created yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lotteries?.map((lottery) => (
            <Card key={lottery.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{lottery.name}</h3>
                      <Badge variant={lottery.is_active ? 'default' : 'secondary'}>
                        {lottery.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {lottery.description && (
                      <p className="text-sm text-muted-foreground">{lottery.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Draw: {format(new Date(lottery.draw_time), 'MMM d, yyyy h:mm a')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">1D: ₹{lottery.single_digit_price} → ₹{lottery.single_digit_win_amount}</span>
                      <span className="bg-muted px-2 py-1 rounded">2D: ₹{lottery.double_digit_price} → ₹{lottery.double_digit_win_amount}</span>
                      <span className="bg-muted px-2 py-1 rounded">3D: ₹{lottery.triple_digit_price} → ₹{lottery.triple_digit_win_amount}</span>
                      <span className="bg-muted px-2 py-1 rounded">BOX: ₹{lottery.triple_box_price} → ₹{lottery.triple_box_win_amount}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(lottery)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
