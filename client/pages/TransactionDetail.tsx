import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Plus,
  Eye,
  Trash2,
  Phone,
  Mail,
  Building
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

interface WireInstruction {
  id: string;
  transaction_id?: string;
  created_by: string;
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  beneficiary_name: string;
  beneficiary_address: string;
  beneficiary_city: string;
  beneficiary_state: string;
  beneficiary_zip: string;
  beneficiary_phone?: string;
  beneficiary_email?: string;
  bank_name: string;
  bank_address: string;
  bank_city: string;
  bank_state: string;
  bank_zip: string;
  routing_number: string;
  account_number: string;
  swift_code?: string;
  wire_amount: number;
  purpose_of_wire: string;
  special_instructions?: string;
  verification_method: string;
}

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [wireInstructions, setWireInstructions] = useState<WireInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id && user) {
      loadTransactionDetails();
      loadWireInstructions();
    }
  }, [id, user]);

  const loadTransactionDetails = async () => {
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

      // Check if user has access to this transaction
      const hasAccess = profile?.is_admin ||
        data.participants?.some((p: any) => p.user_id === user?.id);

      if (!hasAccess) {
        throw new Error('You do not have access to this transaction');
      }

      setTransaction(data);
    } catch (err: any) {
      console.error('Error loading transaction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWireInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from('wire_instructions')
        .select('*')
        .eq('transaction_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWireInstructions(data || []);
    } catch (err: any) {
      console.error('Error loading wire instructions:', err);
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
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getWireStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
      <div className="container max-w-6xl mx-auto py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="container max-w-6xl mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Transaction Not Found</h3>
            <p className="text-muted-foreground mb-6">
              {error || 'The requested transaction could not be found.'}
            </p>
            <Button onClick={() => navigate('/transactions')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transactions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { senders, receivers, escrowAgents } = getParticipantsByRole(transaction.participants || []);

  return (
    <div className="container max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Transactions
        </Button>

        {profile?.is_admin && (
          <Button
            onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Transaction
          </Button>
        )}
      </div>

      {/* Transaction Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(transaction.status)}
              <h1 className="text-3xl font-bold tracking-tight">
                {transaction.transaction_id}
              </h1>
              <Badge className={getStatusColor(transaction.status)}>
                {transaction.status.replace('_', ' ').charAt(0).toUpperCase() +
                 transaction.status.replace('_', ' ').slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created {new Date(transaction.created_at).toLocaleDateString()}
              {transaction.closing_date && ` • Closing: ${new Date(transaction.closing_date).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="wire-instructions">Wire Instructions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Property Information */}
            {transaction.property_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-base">{transaction.property_address}</p>
                  </div>
                  {transaction.property_value && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Property Value</p>
                      <p className="text-xl font-semibold flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        {transaction.property_value.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {transaction.escrow_amount && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Escrow Amount</p>
                      <p className="text-xl font-semibold flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        {transaction.escrow_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-base">{new Date(transaction.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-base">{new Date(transaction.updated_at).toLocaleDateString()}</p>
                </div>
                {transaction.closing_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Closing</p>
                    <p className="text-base">{new Date(transaction.closing_date).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participant Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{senders.length}</p>
                  <p className="text-sm text-muted-foreground">Senders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{receivers.length}</p>
                  <p className="text-sm text-muted-foreground">Receivers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{escrowAgents.length}</p>
                  <p className="text-sm text-muted-foreground">Escrow Agents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-6">
          {senders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Senders</CardTitle>
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
                    <Badge variant="outline">{participant.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {receivers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Receivers</CardTitle>
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
                    <Badge variant="outline">{participant.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {escrowAgents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">Escrow Agents</CardTitle>
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
                    <Badge variant="outline">{participant.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Wire Instructions Tab */}
        <TabsContent value="wire-instructions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Wire Instructions</h3>
            <Button onClick={() => navigate(`/wire-instructions/${transaction.id}`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Wire Instructions
            </Button>
          </div>

          {wireInstructions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Wire Instructions</h3>
                <p className="text-muted-foreground mb-6">
                  No wire instructions have been created for this transaction yet.
                </p>
                <Button onClick={() => navigate(`/wire-instructions/${transaction.id}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wire Instructions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {wireInstructions.map((instruction) => (
                <Card key={instruction.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{instruction.beneficiary_name}</CardTitle>
                          <CardDescription>
                            Created {new Date(instruction.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getWireStatusColor(instruction.status)}>
                          {instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/wire-instructions/${transaction.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className="text-lg font-semibold">
                          ${instruction.wire_amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Bank</p>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span className="text-sm">{instruction.bank_name}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Verification</p>
                        <p className="text-sm capitalize">{instruction.verification_method}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                      <p className="text-sm">{instruction.purpose_of_wire}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Activity</CardTitle>
              <CardDescription>
                Recent activity and updates for this transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Transaction Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {transaction.updated_at !== transaction.created_at && (
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Transaction Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {wireInstructions.map((instruction) => (
                  <div key={instruction.id} className="flex items-center gap-3 p-4 border rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Wire Instructions Added</p>
                      <p className="text-sm text-muted-foreground">
                        {instruction.beneficiary_name} • {new Date(instruction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}