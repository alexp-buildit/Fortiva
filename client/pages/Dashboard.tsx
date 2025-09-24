import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { SenderDashboard } from '@/components/dashboards/SenderDashboard';
import { ReceiverDashboard } from '@/components/dashboards/ReceiverDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut } from 'lucide-react';

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You need to be signed in to access your dashboard.
            </p>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show approval pending message for non-admin users
  if (!profile.is_admin && !profile.admin_approved) {
    return (
      <div className="container flex min-h-screen items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Account Pending Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Your account has been created successfully. An administrator needs to approve your access before you can use the platform.
            </p>
            <p className="text-sm">
              <strong>Email:</strong> {profile.email}
            </p>
            <p className="text-sm">
              <strong>Role:</strong> {profile.is_admin ? 'Admin' : 'User'}
            </p>
            <Button variant="outline" onClick={() => signOut()} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  if (profile.is_admin) {
    return <AdminDashboard />;
  }

  // For non-admin users, determine dashboard based on their typical role
  // This could be enhanced with more sophisticated role detection
  const userRole = profile.username.includes('sender') ? 'sender' : 'receiver';

  if (userRole === 'sender') {
    return <SenderDashboard />;
  }

  return <ReceiverDashboard />;
}