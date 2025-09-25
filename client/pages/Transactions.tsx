import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Eye,
  Edit,
  Search,
  Filter,
  FileText,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  transaction_id: string;
  status: 'pending' | 'in_progress' | 'escrow' | 'released' | 'completed' | 'cancelled';
  property_address?: string;
  property_value?: number;
  escrow_amount?: number;
  closing_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  participants?: Array<{
    id: string;
    user_id: string;
    role: 'sender' | 'receiver' | 'escrow_agent';
    status: string;
    users: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
}

export default function Transactions() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');

      let query = supabase
        .from('transactions')
        .select(`
          *,
          participants:transaction_participants(
            id,
            user_id,
            role,
            status,
            users(first_name, last_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter based on user role
      if (!profile?.is_admin) {
        // For non-admin users, only show their own transactions
        const { data: userTransactions, error: participantError } = await supabase
          .from('transaction_participants')
          .select('transaction_id')
          .eq('user_id', user?.id);

        if (participantError) throw participantError;

        const transactionIds = userTransactions?.map(tp => tp.transaction_id) || [];
        if (transactionIds.length > 0) {
          query = query.in('id', transactionIds);
        } else {
          // User has no transactions
          setTransactions([]);
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'escrow': return 'bg-purple-100 text-purple-800';
      case 'released': return 'bg-indigo-100 text-indigo-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <ArrowUpRight className="h-4 w-4" />;
      case 'escrow': return <FileText className="h-4 w-4" />;
      case 'released': return <ArrowDownLeft className="h-4 w-4" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.property_address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getParticipantsByRole = (participants: any[]) => {
    const senders = participants?.filter(p => p.role === 'sender') || [];
    const receivers = participants?.filter(p => p.role === 'receiver') || [];
    const escrowAgents = participants?.filter(p => p.role === 'escrow_agent') || [];

    return { senders, receivers, escrowAgents };
  };

  if (showCreateForm) {
    return <CreateTransactionForm onCancel={() => setShowCreateForm(false)} onSuccess={() => { setShowCreateForm(false); loadTransactions(); }} />;
  }

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              {profile?.is_admin ? 'Manage all' : 'View your'} secure wire transfer transactions
            </p>
          </div>
          {(profile?.is_admin || ['admin', 'sender'].includes(profile?.is_admin ? 'admin' : 'user')) && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="escrow">In Escrow</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'all' ? 'No matching transactions' : 'No transactions'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first secure transaction.'
              }
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Transaction
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredTransactions.map((transaction) => {
            const { senders, receivers, escrowAgents } = getParticipantsByRole(transaction.participants || []);

            return (
              <Card key={transaction.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <CardTitle className="text-lg">
                          {transaction.transaction_id}
                        </CardTitle>
                      </div>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status.replace('_', ' ').charAt(0).toUpperCase() + transaction.status.replace('_', ' ').slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {profile?.is_admin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>
                    Created {new Date(transaction.created_at).toLocaleDateString()}
                    {transaction.closing_date && ` • Closing: ${new Date(transaction.closing_date).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {transaction.property_address && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Property</p>
                        <p className="text-sm">{transaction.property_address}</p>
                      </div>
                    )}
                    {transaction.property_value && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Property Value</p>
                        <p className="text-sm font-semibold">
                          <DollarSign className="inline h-4 w-4" />
                          {transaction.property_value.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {transaction.escrow_amount && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Escrow Amount</p>
                        <p className="text-sm font-semibold">
                          <DollarSign className="inline h-4 w-4" />
                          {transaction.escrow_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Participants</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        {senders.length}S, {receivers.length}R, {escrowAgents.length}E
                      </div>
                    </div>
                  </div>

                  {/* Participants Preview */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-2">
                      {senders.slice(0, 2).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          📤 {p.users?.first_name} {p.users?.last_name}
                        </Badge>
                      ))}
                      {receivers.slice(0, 2).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          📥 {p.users?.first_name} {p.users?.last_name}
                        </Badge>
                      ))}
                      {escrowAgents.slice(0, 1).map((p, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          🛡️ {p.users?.first_name} {p.users?.last_name}
                        </Badge>
                      ))}
                      {(senders.length + receivers.length + escrowAgents.length) > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(senders.length + receivers.length + escrowAgents.length) - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Placeholder for Create Transaction Form
function CreateTransactionForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    transaction_id: '',
    property_address: '',
    property_value: '',
    escrow_amount: '',
    closing_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const transactionId = formData.transaction_id || `TXN-${Date.now()}`;

      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          property_address: formData.property_address || null,
          property_value: formData.property_value ? parseFloat(formData.property_value) : null,
          escrow_amount: formData.escrow_amount ? parseFloat(formData.escrow_amount) : null,
          closing_date: formData.closing_date || null,
          status: 'pending',
          created_by: user?.id
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add creator as escrow agent participant
      await supabase
        .from('transaction_participants')
        .insert({
          transaction_id: data.id,
          user_id: user?.id,
          role: 'escrow_agent',
          status: 'active'
        });

      onSuccess();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Transaction</CardTitle>
          <CardDescription>
            Set up a new secure wire transfer transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
              <Input
                id="transaction_id"
                value={formData.transaction_id}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                placeholder="Leave blank to auto-generate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_address">Property Address</Label>
              <Input
                id="property_address"
                value={formData.property_address}
                onChange={(e) => setFormData(prev => ({ ...prev, property_address: e.target.value }))}
                placeholder="123 Property Street, City, State"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_value">Property Value</Label>
                <Input
                  id="property_value"
                  type="number"
                  step="0.01"
                  value={formData.property_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_value: e.target.value }))}
                  placeholder="500000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="escrow_amount">Escrow Amount</Label>
                <Input
                  id="escrow_amount"
                  type="number"
                  step="0.01"
                  value={formData.escrow_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, escrow_amount: e.target.value }))}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="closing_date">Expected Closing Date</Label>
              <Input
                id="closing_date"
                type="date"
                value={formData.closing_date}
                onChange={(e) => setFormData(prev => ({ ...prev, closing_date: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}