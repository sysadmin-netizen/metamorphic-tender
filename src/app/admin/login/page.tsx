'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data: { success: boolean; error?: string } = await res.json();

        if (!data.success) {
          setError(data.error ?? 'Authentication failed');
          setLoading(false);
          return;
        }

        router.push('/admin');
      } catch {
        setError('Network error. Please try again.');
        setLoading(false);
      }
    },
    [password, router],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/logo.svg" alt="Metamorphic logo" className="h-12 w-12" />
          <h1 className="mt-4 text-lg font-semibold text-stone-200">
            Tender Portal Administration
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Enter your admin password to continue
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-stone-800 bg-stone-900 p-6 shadow-xl"
        >
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Password field */}
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-stone-400 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-md border border-stone-700 bg-stone-800 px-3 py-2.5 text-sm text-stone-200 placeholder:text-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Enter admin password"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || password.length === 0}
            className="w-full rounded-md bg-amber-600 py-2.5 text-sm font-semibold text-stone-900 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
