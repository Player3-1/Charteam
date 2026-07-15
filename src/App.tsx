import React, { useState, useEffect } from 'react';
import { Home } from '@/components/home-tab';
import { AuthModal } from '@/components/auth-modal';
import { UserData } from '@/types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 font-body antialiased selection:bg-amber-300 selection:text-slate-900">
      {user ? <Home user={user} /> : <AuthModal onLogin={setUser} />}
    </div>
  );
};

export default App;
