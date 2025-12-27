import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Layout } from '@/components/layout';
import { authApi, sitesApi } from '@/lib/api';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [siteId, setSiteId] = useState<number | ''>('');
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await sitesApi.getAll(1, 100);
      setSites(response.items);
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteId) {
      setError('Please select a site');
      return;
    }
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.login(username, password, Number(siteId));
      setSuccess('Login successful!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithCookie = async () => {
    if (!siteId) {
      setError('Please select a site');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authApi.loginWithCookie(Number(siteId));
      setSuccess('Login with cookie successful!');
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Login with cookie failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Login to XenForo Site</CardTitle>
            <CardDescription>
              Authenticate with a XenForo site to enable syncing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Select
                  id="site"
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name || site.url}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                  {success}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoginWithCookie}
                  disabled={loading}
                >
                  Login with Cookie
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

