import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  XCircle,
  Shield,
  Lock,
  Unlock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WireInstructionForm, { type WireInstructionData } from '@/components/WireInstructionForm';

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

// Enhanced Create Transaction Form with Wire Instructions
function CreateTransactionForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('transaction');
  const [createdTransaction, setCreatedTransaction] = useState<any>(null);
  const [wireInstructionOption, setWireInstructionOption] = useState<'none' | 'existing' | 'new'>('none');
  const [existingWireInstructions, setExistingWireInstructions] = useState<any[]>([]);
  const [selectedWireInstruction, setSelectedWireInstruction] = useState<string>('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');

  const [formData, setFormData] = useState({
    transaction_id: '',
    property_address: '',
    property_value: '',
    escrow_amount: '',
    closing_date: ''
  });

  // Load existing wire instructions when component mounts
  useEffect(() => {
    loadExistingWireInstructions();
  }, [user]);

  const loadExistingWireInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('wire_instructions')
        .select('*')
        .eq('created_by', user?.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExistingWireInstructions(data || []);
    } catch (err: any) {
      console.error('Error loading wire instructions:', err);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
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

      setCreatedTransaction(data);

      // If no wire instructions needed, complete the process
      if (wireInstructionOption === 'none') {
        onSuccess();
        return;
      }

      // If existing wire instruction selected, link it
      if (wireInstructionOption === 'existing' && selectedWireInstruction) {
        await supabase
          .from('wire_instructions')
          .update({ transaction_id: data.id })
          .eq('id', selectedWireInstruction);

        onSuccess();
        return;
      }

      // If new wire instruction, move to wire instruction tab
      if (wireInstructionOption === 'new') {
        setActiveTab('wire-instructions');
      }

    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWireInstructionSubmit = (data: WireInstructionData) => {
    // Wire instruction was successfully created and linked to transaction
    onSuccess();
  };

  const handlePasswordVerification = async () => {
    // In a real implementation, you'd verify the password against the user's account
    // For this demo, we'll just check if a password was entered
    if (!password.trim()) {
      setError('Password is required to access saved wire instructions');
      return;
    }

    // Simple password check - in production, this would be handled securely
    try {
      // You could verify the password against the user's account here
      // For now, we'll assume any non-empty password is valid
      setShowPasswordDialog(false);
      setPassword('');
      setWireInstructionOption('existing');
    } catch (err: any) {
      setError('Invalid password');
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Transaction</CardTitle>
          <CardDescription>
            Set up a new secure wire transfer transaction with optional wire instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transaction">Transaction Details</TabsTrigger>
              <TabsTrigger value="wire-instructions" disabled={!createdTransaction}>
                Wire Instructions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transaction" className="space-y-6">
              <form onSubmit={handleTransactionSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Transaction Details */}
                <div className="space-y-4">
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
                </div>

                {/* Wire Instructions Options */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Wire Instructions</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="wire-none"
                        name="wire-option"
                        value="none"
                        checked={wireInstructionOption === 'none'}
                        onChange={(e) => setWireInstructionOption('none')}
                      />
                      <Label htmlFor="wire-none">Skip wire instructions for now</Label>
                    </div>

                    {existingWireInstructions.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="wire-existing"
                          name="wire-option"
                          value="existing"
                          checked={wireInstructionOption === 'existing'}
                          onChange={() => setShowPasswordDialog(true)}
                        />
                        <Label htmlFor="wire-existing" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Use existing wire instructions (requires password)
                        </Label>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="wire-new"
                        name="wire-option"
                        value="new"
                        checked={wireInstructionOption === 'new'}
                        onChange={(e) => setWireInstructionOption('new')}
                      />
                      <Label htmlFor="wire-new" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create new wire instructions
                      </Label>
                    </div>
                  </div>

                  {/* Existing Wire Instructions Selection */}
                  {wireInstructionOption === 'existing' && (
                    <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                      <Label htmlFor="existing-selection">Select Wire Instructions:</Label>
                      <Select value={selectedWireInstruction} onValueChange={setSelectedWireInstruction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose from saved instructions" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingWireInstructions.map((instruction) => (
                            <SelectItem key={instruction.id} value={instruction.id}>
                              {instruction.beneficiary_name} - ${instruction.wire_amount?.toLocaleString() || 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
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
            </TabsContent>

            <TabsContent value="wire-instructions">
              {createdTransaction && (
                <WireInstructionForm
                  transactionId={createdTransaction.id}
                  mode="create"
                  onSubmit={handleWireInstructionSubmit}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Verify Password
            </DialogTitle>
            <DialogDescription>
              Enter your password to access saved wire instructions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordVerification()}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePasswordVerification}>
                <Unlock className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}