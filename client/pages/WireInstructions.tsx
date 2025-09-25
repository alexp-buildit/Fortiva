import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Plus, Eye, Edit, Trash2, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WireInstructionForm, { type WireInstructionData } from '@/components/WireInstructionForm';

interface WireInstruction {
  id: string;
  transaction_id?: string;
  created_by: string;
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  beneficiary_name: string;
  wire_amount: number;
  purpose_of_wire: string;
  verification_method: string;
}

export default function WireInstructions() {
  const { user, profile } = useAuth();
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState<WireInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState<WireInstruction | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

  useEffect(() => {
    if (user) {
      loadWireInstructions();
    }
  }, [user, transactionId]);

  const loadWireInstructions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('wire_instructions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionId) {
        query = query.eq('transaction_id', transactionId);
      } else if (profile?.is_admin) {
        // Admin sees all instructions
      } else {
        // Users see only their own instructions
        query = query.eq('created_by', user?.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setInstructions(data || []);
    } catch (err: any) {
      console.error('Error loading wire instructions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedInstruction(null);
    setFormMode('create');
    setShowForm(true);
  };

  const handleView = (instruction: WireInstruction) => {
    setSelectedInstruction(instruction);
    setFormMode('view');
    setShowForm(true);
  };

  const handleEdit = (instruction: WireInstruction) => {
    setSelectedInstruction(instruction);
    setFormMode('edit');
    setShowForm(true);
  };

  const handleDelete = async (instruction: WireInstruction) => {
    if (!confirm('Are you sure you want to delete this wire instruction?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('wire_instructions')
        .delete()
        .eq('id', instruction.id);

      if (deleteError) throw deleteError;

      await loadWireInstructions();
    } catch (err: any) {
      console.error('Error deleting wire instruction:', err);
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (instruction: WireInstruction, status: string) => {
    try {
      const { error: updateError } = await supabase
        .from('wire_instructions')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', instruction.id);

      if (updateError) throw updateError;

      await loadWireInstructions();
    } catch (err: any) {
      console.error('Error updating wire instruction status:', err);
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showForm) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowForm(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instructions
          </Button>
        </div>
        <WireInstructionForm
          transactionId={transactionId}
          mode={formMode}
          initialData={selectedInstruction || undefined}
          onSubmit={(data) => {
            setShowForm(false);
            loadWireInstructions();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Wire Instructions</h1>
            <p className="text-muted-foreground">
              {transactionId ? 'Transaction-specific' : 'Manage your secure'} wire transfer instructions
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Wire Instruction
          </Button>
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
      ) : instructions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Wire Instructions</h3>
            <p className="text-muted-foreground mb-6">
              {transactionId
                ? 'No wire instructions have been created for this transaction yet.'
                : 'You haven\'t created any wire instructions yet.'
              }
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Wire Instruction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {instructions.map((instruction) => (
            <Card key={instruction.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <CardTitle className="text-lg">
                        {instruction.beneficiary_name}
                      </CardTitle>
                    </div>
                    <Badge className={getStatusColor(instruction.status)}>
                      {instruction.status.charAt(0).toUpperCase() + instruction.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(instruction)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    {(instruction.created_by === user?.id || profile?.is_admin) && (
                      <>
                        {instruction.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(instruction)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {(instruction.status === 'pending' || instruction.status === 'rejected') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(instruction)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </>
                    )}
                    {profile?.is_admin && (
                      <div className="flex items-center gap-1 ml-2 border-l pl-2">
                        {instruction.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction, 'verified')}
                              className="text-blue-600"
                            >
                              Verify
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction, 'approved')}
                              className="text-green-600"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(instruction, 'rejected')}
                              className="text-red-600"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {instruction.status === 'verified' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(instruction, 'approved')}
                            className="text-green-600"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Created {new Date(instruction.created_at).toLocaleDateString()} •
                  Verification: {instruction.verification_method}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-lg font-semibold">
                      ${instruction.wire_amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-sm">{instruction.purpose_of_wire}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}