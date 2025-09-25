import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Download,
  FileText,
  Clock,
  CheckCircle2,
  Banknote,
  MessageSquare,
  Shield,
  LogOut,
  Settings,
  PlusCircle
} from 'lucide-react';

export function ReceiverDashboard() {
  const { profile, signOut } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    received: 0,
    total: 0
  });

  useEffect(() => {
    loadTransactions();
  }, [profile]);

  const loadTransactions = async () => {
    if (!profile) return;

    try {
      // Load transactions where user is a receiver
      const { data: transactionParticipants, error } = await supabase
        .from('transaction_participants')
        .select(`
          transaction_id,
          status,
          transactions (
            id,
            transaction_id,
            status,
            property_address,
            created_at
          )
        `)
        .eq('user_id', profile.id)
        .eq('role', 'receiver');

      if (!error && transactionParticipants) {
        const transactionData = transactionParticipants
          .map(tp => tp.transactions)
          .filter(Boolean);

        setTransactions(transactionData as any);

        // Calculate stats
        const pending = transactionData.filter(t => t.status !== 'completed').length;
        const received = transactionData.filter(t => t.status === 'completed').length;

        setStats({
          pending,
          received,
          total: transactionData.length
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Receiver Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funds Received</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.received}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Wire Instructions
            </CardTitle>
            <CardDescription>
              Provide your banking details for incoming transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Add Banking Information
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Confirm Receipt
            </CardTitle>
            <CardDescription>
              Mark received wire transfers as confirmed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Confirm Receipts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Secure Messages
            </CardTitle>
            <CardDescription>
              Communicate with transaction participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              View Messages
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Incoming wire transfers and transaction activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">You'll see incoming wire transfers here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{transaction.transaction_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Panel */}
      <Card className="mt-8 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Download className="h-5 w-5" />
            How Wire Transfers Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>1. <strong>Provide Banking Information:</strong> Add your wire instructions securely</p>
            <p>2. <strong>Share with Senders:</strong> Generate secure links for senders to access your details</p>
            <p>3. <strong>Monitor Incoming Transfers:</strong> Track when transfers are initiated</p>
            <p>4. <strong>Confirm Receipt:</strong> Mark transfers as received once funds arrive</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Status */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Banking information encrypted and secure
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Multi-factor authentication active
            </p>
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              All communications encrypted end-to-end
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}