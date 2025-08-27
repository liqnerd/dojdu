"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { clearJwt, fetchCurrentUser, getJwt } from '@/lib/auth';

export function UserMenu() {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const logout = () => {
    clearJwt();
    setUser(null);
    if (typeof window !== 'undefined') window.location.reload();
  };

  if (!getJwt() || !user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/auth/login">Login</Link>
        <Link href="/auth/register" className="underline">Create account</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground">{user.username}</span>
      <Link href="/profile" className="underline">Profile</Link>
      <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
    </div>
  );
}

