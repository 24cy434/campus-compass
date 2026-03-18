import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Plus, Menu, X } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const studentLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/my-complaints', label: 'My Complaints' },
    { to: '/public-complaints', label: 'Public Feed' },
  ];

  const facultyLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/assigned', label: 'Assigned' },
    { to: '/my-complaints', label: 'My Complaints' },
    { to: '/public-complaints', label: 'Public Feed' },
  ];

  const adminLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/all-complaints', label: 'All Complaints' },
    { to: '/categories', label: 'Categories' },
    { to: '/faculty-approval', label: 'Faculty Approval' },
    { to: '/users', label: 'Users' },
  ];

  const links = user.role === 'admin' ? adminLinks : user.role === 'faculty' ? facultyLinks : studentLinks;
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 card-shadow">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-display text-foreground flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">R</span>
            </div>
            RBCMS
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-md text-body transition-colors ${
                  isActive(link.to)
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user.role !== 'admin' && (
            <Button size="sm" onClick={() => navigate('/new-complaint')}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Report Issue</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden border-t border-border px-4 py-2 space-y-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-body transition-colors ${
                isActive(link.to)
                  ? 'bg-secondary text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};
