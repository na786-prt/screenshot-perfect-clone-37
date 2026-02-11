import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dice5, Wallet, LogOut, Shield } from 'lucide-react';

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { balance } = useWallet();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-strong safe-top">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Dice5 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">RASI</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <Link to="/wallet">
              <Button variant="secondary" size="sm" className="gap-1.5 h-9 rounded-full px-3 font-bold text-sm">
                <Wallet className="w-4 h-4" />
                ₹{Number(balance).toFixed(0)}
              </Button>
            </Link>

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Shield className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 text-primary">
                      <Shield className="w-4 h-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="rounded-full h-9 px-5">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
