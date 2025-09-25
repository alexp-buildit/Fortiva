import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ShieldCheck,
  Building2,
  Users,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DemoRequestData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  job_title: string;
  company_size: string;
  use_case: string;
  monthly_volume: string;
  preferred_demo_time: string;
  additional_notes: string;
  industry: string;
  marketing_consent: boolean;
}

export default function DemoRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<DemoRequestData>({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    job_title: '',
    company_size: '',
    use_case: '',
    monthly_volume: '',
    preferred_demo_time: '',
    additional_notes: '',
    industry: '',
    marketing_consent: false,
  });

  const handleInputChange = (field: keyof DemoRequestData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.contact_name.trim()) {
      setError('Contact name is required');
      return false;
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Valid email address is required');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.use_case.trim()) {
      setError('Use case description is required');
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
      // Insert demo request into database
      const { error: insertError } = await supabase
        .from('demo_requests')
        .insert({
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          job_title: formData.job_title,
          company_size: formData.company_size,
          industry: formData.industry,
          use_case: formData.use_case,
          monthly_volume: formData.monthly_volume,
          preferred_demo_time: formData.preferred_demo_time,
          additional_notes: formData.additional_notes,
          marketing_consent: formData.marketing_consent,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Demo request error:', err);
      setError(err.message || 'Failed to submit demo request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-green-100 px-3 py-1 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>Demo Request Submitted</span>
            </div>
            <CardTitle className="text-2xl text-green-800">Thank You!</CardTitle>
            <CardDescription className="text-green-700">
              Your demo request has been successfully submitted. Our team will contact you within 24 hours to schedule your personalized demonstration.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                <div className="text-sm text-green-700 space-y-2">
                  <p className="flex items-center gap-2 justify-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    Our security expert will review your requirements
                  </p>
                  <p className="flex items-center gap-2 justify-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    We'll schedule a 30-minute personalized demo
                  </p>
                  <p className="flex items-center gap-2 justify-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    You'll receive a custom security assessment
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="mt-6"
              >
                Return to Homepage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-2 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" />
          <span>Enterprise Security Demo</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          See Fortiva in Action
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Schedule a personalized demonstration of our secure wire transfer platform and learn how we can protect your commercial real estate transactions.
        </p>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Bank-Grade Security</h3>
              <p className="text-sm text-muted-foreground">End-to-end encryption</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Multi-Party Verification</h3>
              <p className="text-sm text-muted-foreground">Secure collaboration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Real Estate Focus</h3>
              <p className="text-sm text-muted-foreground">Industry expertise</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Schedule Your Demo
          </CardTitle>
          <CardDescription>
            Fill out the form below and we'll contact you within 24 hours to schedule your personalized demonstration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-medium">Company Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Acme Real Estate"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial_real_estate">Commercial Real Estate</SelectItem>
                      <SelectItem value="residential_real_estate">Residential Real Estate</SelectItem>
                      <SelectItem value="property_management">Property Management</SelectItem>
                      <SelectItem value="title_company">Title Company</SelectItem>
                      <SelectItem value="law_firm">Law Firm</SelectItem>
                      <SelectItem value="financial_services">Financial Services</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-medium">Contact Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Full Name *</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Job Title</Label>
                  <Input
                    id="job_title"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    placeholder="Chief Financial Officer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-medium">Your Requirements</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="use_case">Primary Use Case *</Label>
                <Textarea
                  id="use_case"
                  value={formData.use_case}
                  onChange={(e) => handleInputChange('use_case', e.target.value)}
                  placeholder="Describe your primary use case for secure wire transfers (e.g., commercial property acquisitions, escrow management, multi-party transactions)"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_volume">Monthly Transaction Volume</Label>
                  <Select value={formData.monthly_volume} onValueChange={(value) => handleInputChange('monthly_volume', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select volume range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 transactions</SelectItem>
                      <SelectItem value="11-50">11-50 transactions</SelectItem>
                      <SelectItem value="51-100">51-100 transactions</SelectItem>
                      <SelectItem value="100+">100+ transactions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_demo_time">Preferred Demo Time</Label>
                  <Select value={formData.preferred_demo_time} onValueChange={(value) => handleInputChange('preferred_demo_time', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select preferred time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (9AM - 12PM EST)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 5PM EST)</SelectItem>
                      <SelectItem value="evening">Evening (5PM - 7PM EST)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  placeholder="Any specific questions or requirements you'd like us to address during the demo?"
                />
              </div>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing_consent"
                checked={formData.marketing_consent}
                onCheckedChange={(checked) => handleInputChange('marketing_consent', checked as boolean)}
              />
              <div className="text-sm">
                <Label htmlFor="marketing_consent" className="text-sm">
                  I agree to receive marketing communications from Fortiva about our secure wire transfer platform and related services. You can unsubscribe at any time.
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting Request...' : 'Schedule My Demo'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary mb-1">Your Information is Secure</p>
              <p className="text-primary/80">
                All demo request information is encrypted and handled in accordance with our privacy policy.
                We never share your information with third parties and use it solely to provide you with the requested demonstration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}