import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Building, DollarSign, User, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface WireInstructionFormProps {
  transactionId?: string;
  onSubmit?: (data: WireInstructionData) => void;
  initialData?: Partial<WireInstructionData>;
  mode?: 'create' | 'edit' | 'view';
}

export interface WireInstructionData {
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
  verification_method: 'phone' | 'email' | 'in_person';
}

export default function WireInstructionForm({
  transactionId,
  onSubmit,
  initialData,
  mode = 'create'
}: WireInstructionFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<WireInstructionData>({
    beneficiary_name: initialData?.beneficiary_name || '',
    beneficiary_address: initialData?.beneficiary_address || '',
    beneficiary_city: initialData?.beneficiary_city || '',
    beneficiary_state: initialData?.beneficiary_state || '',
    beneficiary_zip: initialData?.beneficiary_zip || '',
    beneficiary_phone: initialData?.beneficiary_phone || '',
    beneficiary_email: initialData?.beneficiary_email || '',
    bank_name: initialData?.bank_name || '',
    bank_address: initialData?.bank_address || '',
    bank_city: initialData?.bank_city || '',
    bank_state: initialData?.bank_state || '',
    bank_zip: initialData?.bank_zip || '',
    routing_number: initialData?.routing_number || '',
    account_number: initialData?.account_number || '',
    swift_code: initialData?.swift_code || '',
    wire_amount: initialData?.wire_amount || 0,
    purpose_of_wire: initialData?.purpose_of_wire || '',
    special_instructions: initialData?.special_instructions || '',
    verification_method: initialData?.verification_method || 'email',
  });

  const handleInputChange = (field: keyof WireInstructionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.beneficiary_name.trim()) {
      setError('Beneficiary name is required');
      return false;
    }
    if (!formData.bank_name.trim()) {
      setError('Bank name is required');
      return false;
    }
    if (!formData.routing_number.trim() || formData.routing_number.length !== 9) {
      setError('Valid 9-digit routing number is required');
      return false;
    }
    if (!formData.account_number.trim()) {
      setError('Account number is required');
      return false;
    }
    if (formData.wire_amount <= 0) {
      setError('Wire amount must be greater than 0');
      return false;
    }
    if (!formData.purpose_of_wire.trim()) {
      setError('Purpose of wire is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        const { data, error: submitError } = await supabase
          .from('wire_instructions')
          .insert({
            transaction_id: transactionId,
            created_by: user?.id,
            ...formData
          })
          .select()
          .single();

        if (submitError) throw submitError;

        setSuccess(true);
        if (onSubmit) onSubmit(formData);
      } else if (mode === 'edit') {
        // Handle edit mode
        if (onSubmit) onSubmit(formData);
      }
    } catch (err: any) {
      console.error('Wire instruction submission error:', err);
      setError(err.message || 'Failed to save wire instructions');
    } finally {
      setLoading(false);
    }
  };

  if (success && mode === 'create') {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-green-50 px-3 py-1 text-sm text-green-700">
            <Shield className="h-4 w-4" />
            <span>Wire Instructions Secured</span>
          </div>
          <CardTitle className="text-xl">Instructions Submitted</CardTitle>
          <CardDescription>
            Your wire instructions have been securely encrypted and submitted for review.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isReadOnly = mode === 'view';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          {mode === 'create' ? 'Secure Wire Instructions' :
           mode === 'edit' ? 'Edit Wire Instructions' :
           'Wire Instructions'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' ? 'All information will be encrypted and verified before processing' :
           mode === 'view' ? 'View encrypted wire instruction details' :
           'Update wire instruction information'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Beneficiary Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-medium">Beneficiary Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary_name">Full Name *</Label>
                <Input
                  id="beneficiary_name"
                  value={formData.beneficiary_name}
                  onChange={(e) => handleInputChange('beneficiary_name', e.target.value)}
                  placeholder="John Smith"
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiary_email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="beneficiary_email"
                    type="email"
                    value={formData.beneficiary_email}
                    onChange={(e) => handleInputChange('beneficiary_email', e.target.value)}
                    placeholder="john@company.com"
                    className="pl-10"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary_address">Address *</Label>
              <Input
                id="beneficiary_address"
                value={formData.beneficiary_address}
                onChange={(e) => handleInputChange('beneficiary_address', e.target.value)}
                placeholder="123 Main Street"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="beneficiary_city">City *</Label>
                <Input
                  id="beneficiary_city"
                  value={formData.beneficiary_city}
                  onChange={(e) => handleInputChange('beneficiary_city', e.target.value)}
                  placeholder="New York"
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiary_state">State *</Label>
                <Input
                  id="beneficiary_state"
                  value={formData.beneficiary_state}
                  onChange={(e) => handleInputChange('beneficiary_state', e.target.value)}
                  placeholder="NY"
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="beneficiary_zip">ZIP Code *</Label>
                <Input
                  id="beneficiary_zip"
                  value={formData.beneficiary_zip}
                  onChange={(e) => handleInputChange('beneficiary_zip', e.target.value)}
                  placeholder="10001"
                  required
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="beneficiary_phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="beneficiary_phone"
                  type="tel"
                  value={formData.beneficiary_phone}
                  onChange={(e) => handleInputChange('beneficiary_phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                  readOnly={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Building className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-medium">Bank Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                placeholder="Chase Bank"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_address">Bank Address *</Label>
              <Input
                id="bank_address"
                value={formData.bank_address}
                onChange={(e) => handleInputChange('bank_address', e.target.value)}
                placeholder="456 Bank Street"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_city">City *</Label>
                <Input
                  id="bank_city"
                  value={formData.bank_city}
                  onChange={(e) => handleInputChange('bank_city', e.target.value)}
                  placeholder="New York"
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_state">State *</Label>
                <Input
                  id="bank_state"
                  value={formData.bank_state}
                  onChange={(e) => handleInputChange('bank_state', e.target.value)}
                  placeholder="NY"
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_zip">ZIP Code *</Label>
                <Input
                  id="bank_zip"
                  value={formData.bank_zip}
                  onChange={(e) => handleInputChange('bank_zip', e.target.value)}
                  placeholder="10001"
                  required
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="routing_number">Routing Number *</Label>
                <Input
                  id="routing_number"
                  value={formData.routing_number}
                  onChange={(e) => handleInputChange('routing_number', e.target.value)}
                  placeholder="123456789"
                  maxLength={9}
                  required
                  readOnly={isReadOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  placeholder="1234567890"
                  required
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="swift_code">SWIFT Code (International)</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) => handleInputChange('swift_code', e.target.value)}
                placeholder="CHASUS33"
                readOnly={isReadOnly}
              />
            </div>
          </div>

          {/* Wire Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-medium">Wire Transfer Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wire_amount">Wire Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="wire_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.wire_amount}
                  onChange={(e) => handleInputChange('wire_amount', parseFloat(e.target.value) || 0)}
                  placeholder="100000.00"
                  className="pl-10"
                  required
                  readOnly={isReadOnly}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose_of_wire">Purpose of Wire *</Label>
              <Textarea
                id="purpose_of_wire"
                value={formData.purpose_of_wire}
                onChange={(e) => handleInputChange('purpose_of_wire', e.target.value)}
                placeholder="Commercial real estate purchase - 123 Property Street"
                required
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => handleInputChange('special_instructions', e.target.value)}
                placeholder="Any additional instructions for the wire transfer"
                readOnly={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_method">Verification Method *</Label>
              <Select
                value={formData.verification_method}
                onValueChange={(value: 'phone' | 'email' | 'in_person') => handleInputChange('verification_method', value)}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Verification</SelectItem>
                  <SelectItem value="phone">Phone Verification</SelectItem>
                  <SelectItem value="in_person">In-Person Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isReadOnly && (
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ?
                (mode === 'create' ? 'Securing Instructions...' : 'Updating...') :
                (mode === 'create' ? 'Submit Secure Wire Instructions' : 'Update Instructions')
              }
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}