import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Save,
  Trash2,
  UserPlus,
  X,
  Mail,
  Phone,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  XCircle,
  CheckCircle2
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
      phone?: string;
    };
  }>;
}

export default function TransactionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const [formData, setFormData] = useState({
    transaction_id: '',
    property_address: '',
    property_value: '',
    escrow_amount: '',
    closing_date: '',
    status: 'pending' as const
  });

  const [newParticipant, setNewParticipant] = useState({
    email: '',
    role: 'receiver' as const,
    showForm: false
  });

  useEffect(() => {
    if (id && user) {
      loadTransaction();
    }
  }, [id, user]);

  const loadTransaction = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          participants:transaction_participants(
            id,
            user_id,
            role,
            status,
            users(first_name, last_name, email, phone)
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Check admin access
      if (!profile?.is_admin) {
        throw new Error('Admin access required to edit transactions');
      }

      setTransaction(data);
      setFormData({
        transaction_id: data.transaction_id,
        property_address: data.property_address || '',
        property_value: data.property_value?.toString() || '',
        escrow_amount: data.escrow_amount?.toString() || '',
        closing_date: data.closing_date || '',
        status: data.status
      });
    } catch (err: any) {
      console.error('Error loading transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          transaction_id: formData.transaction_id,
          property_address: formData.property_address || null,
          property_value: formData.property_value ? parseFloat(formData.property_value) : null,
          escrow_amount: formData.escrow_amount ? parseFloat(formData.escrow_amount) : null,
          closing_date: formData.closing_date || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/transactions/${id}`);
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddParticipant = async () => {
    try {
      setError('');

      // First, check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('email', newParticipant.email)
        .single();

      if (userError) {
        throw new Error('User not found. They must create an account first.');
      }

      // Check if user is already a participant
      const existingParticipant = transaction?.participants?.find(
        p => p.user_id === userData.id
      );

      if (existingParticipant) {
        throw new Error('User is already a participant in this transaction');
      }

      // Add participant
      const { error: participantError } = await supabase
        .from('transaction_participants')
        .insert({
          transaction_id: id,
          user_id: userData.id,
          role: newParticipant.role,
          status: 'invited'
        });

      if (participantError) throw participantError;

      // Reload transaction data
      await loadTransaction();

      // Reset form
      setNewParticipant({
        email: '',
        role: 'receiver',
        showForm: false
      });
    } catch (err: any) {
      console.error('Error adding participant:', err);
      setError(err.message);
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transaction_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      // Reload transaction data
      await loadTransaction();
    } catch (err: any) {
      console.error('Error removing participant:', err);
      setError(err.message);
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

  const getParticipantsByRole = (participants: any[]) => {
    const senders = participants?.filter(p => p.role === 'sender') || [];
    const receivers = participants?.filter(p => p.role === 'receiver') || [];
    const escrowAgents = participants?.filter(p => p.role === 'escrow_agent') || [];

    return { senders, receivers, escrowAgents };
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/transactions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { senders, receivers, escrowAgents } = getParticipantsByRole(transaction?.participants || []);

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/transactions/${id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transaction
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/transactions/${id}`)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Transaction Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Transaction
          </h1>
          {transaction && (
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status.replace('_', ' ').charAt(0).toUpperCase() +
               transaction.status.replace('_', ' ').slice(1)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {formData.transaction_id || 'New Transaction'}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Transaction Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID</Label>
                  <Input
                    id="transaction_id"
                    value={formData.transaction_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, transaction_id: e.target.value }))}
                    placeholder="TXN-1234567890"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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

              <div className="space-y-2">
                <Label htmlFor="property_address">Property Address</Label>
                <Input
                  id="property_address"
                  value={formData.property_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, property_address: e.target.value }))}
                  placeholder="123 Property Street, City, State, ZIP"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_value">Property Value</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="property_value"
                      type="number"
                      step="0.01"
                      value={formData.property_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, property_value: e.target.value }))}
                      placeholder="500000"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="escrow_amount">Escrow Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="escrow_amount"
                      type="number"
                      step="0.01"
                      value={formData.escrow_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, escrow_amount: e.target.value }))}
                      placeholder="50000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing_date">Expected Closing Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="closing_date"
                    type="date"
                    value={formData.closing_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, closing_date: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          {/* Add Participant */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Participant
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewParticipant(prev => ({ ...prev, showForm: !prev.showForm }))}
                >
                  {newParticipant.showForm ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Participant
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {newParticipant.showForm && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="participant_email">Email</Label>
                    <Input
                      id="participant_email"
                      type="email"
                      value={newParticipant.email}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="participant_role">Role</Label>
                    <Select
                      value={newParticipant.role}
                      onValueChange={(value: any) => setNewParticipant(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sender">Sender</SelectItem>
                        <SelectItem value="receiver">Receiver</SelectItem>
                        <SelectItem value="escrow_agent">Escrow Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button onClick={handleAddParticipant} disabled={!newParticipant.email}>
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Current Participants */}
          {escrowAgents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Escrow Agents ({escrowAgents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {escrowAgents.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {participant.users.first_name} {participant.users.last_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {participant.users.email}
                        </span>
                        {participant.users.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {participant.users.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{participant.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {senders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Senders ({senders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {senders.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {participant.users.first_name} {participant.users.last_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {participant.users.email}
                        </span>
                        {participant.users.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {participant.users.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{participant.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {receivers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Receivers ({receivers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {receivers.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {participant.users.first_name} {participant.users.last_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {participant.users.email}
                        </span>
                        {participant.users.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {participant.users.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{participant.status}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}