import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { User, Loader2, Save, LogOut, Mail, Phone } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      if (error) throw error;
      if (data) { setFullName(data.full_name || ''); setMobile(data.mobile || ''); }
      return data;
    },
    enabled: !!user,
  });

  const handleUpdate = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, mobile }).eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Profile Updated ✓' });
      refetch();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally { setIsUpdating(false); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-5 pb-24">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Profile</h1>
        <p className="text-sm text-muted-foreground mb-5">Manage your account</p>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            <span className="text-2xl font-extrabold text-primary-foreground">
              {(fullName || user?.email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-lg">{fullName || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-4 space-y-4 mb-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
            </Label>
            <Input value={user?.email || ''} disabled className="h-11 rounded-xl bg-muted/50" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
            </Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" className="h-11 rounded-xl" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Mobile
            </Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="Enter mobile number" className="h-11 rounded-xl" />
          </div>

          <Button className="w-full h-12 rounded-2xl font-bold" onClick={handleUpdate} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        <Button variant="outline" className="w-full h-12 rounded-2xl font-semibold text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </Layout>
  );
}
