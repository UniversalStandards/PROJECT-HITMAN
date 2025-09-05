import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { 
  Building, Phone, Mail, MapPin, Clock, Send, MessageSquare,
  Users, FileText, DollarSign, Shield, Home, Calendar
} from 'lucide-react';

const departments = [
  {
    name: 'General Inquiries',
    phone: '(555) 010-0000',
    email: 'info@gov.local',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    address: '123 Government Plaza, Main Floor'
  },
  {
    name: 'Finance & Treasury',
    phone: '(555) 010-0100',
    email: 'finance@gov.local',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    address: '123 Government Plaza, 2nd Floor'
  },
  {
    name: 'Public Works',
    phone: '(555) 010-0200',
    email: 'publicworks@gov.local',
    hours: 'Mon-Fri: 7:00 AM - 4:00 PM',
    address: '456 Service Center Drive'
  },
  {
    name: 'Permits & Licensing',
    phone: '(555) 010-0300',
    email: 'permits@gov.local',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    address: '123 Government Plaza, 1st Floor'
  },
  {
    name: 'Emergency Services',
    phone: '911',
    email: 'emergency@gov.local',
    hours: '24/7',
    address: '789 Emergency Response Center'
  },
  {
    name: 'Human Resources',
    phone: '(555) 010-0400',
    email: 'hr@gov.local',
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
    address: '123 Government Plaza, 3rd Floor'
  }
];

const quickContacts = [
  { icon: Shield, label: 'Report an Issue', href: '#', description: 'Street repairs, water leaks, etc.' },
  { icon: FileText, label: 'Request Records', href: '#', description: 'Public records and documents' },
  { icon: Users, label: 'Schedule Appointment', href: '#', description: 'Meet with department staff' },
  { icon: Calendar, label: 'Event Calendar', href: '/news', description: 'Public meetings and events' },
];

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Message Sent",
      description: "We've received your message and will respond within 2 business days.",
    });
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Contact Us</h1>
              <p className="mt-2 text-blue-100">We're here to help and answer your questions</p>
            </div>
            <Button variant="secondary" asChild data-testid="button-home">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select 
                        value={formData.department}
                        onValueChange={(value) => setFormData({...formData, department: value})}
                      >
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept.name} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      data-testid="input-subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      data-testid="input-message"
                    />
                  </div>

                  <Button type="submit" className="w-full" data-testid="button-submit">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Contact Options */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickContacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <Card key={contact.label} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{contact.label}</h3>
                          <p className="text-sm text-muted-foreground">{contact.description}</p>
                          <Button 
                            variant="link" 
                            className="px-0 mt-1" 
                            asChild
                            data-testid={`button-${contact.label.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={contact.href}>Get Started →</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Information Sidebar */}
          <div className="space-y-6">
            {/* Main Office */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Main Office
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">123 Government Plaza</p>
                    <p className="text-sm text-muted-foreground">City, State 12345</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <p>(555) 010-0000</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <p>info@gov.local</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">Mon-Fri: 8:00 AM - 5:00 PM</p>
                </div>
              </CardContent>
            </Card>

            {/* Department Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Department Contacts</CardTitle>
                <CardDescription>Direct lines to specific departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {departments.map((dept) => (
                    <div key={dept.name} className="pb-3 border-b last:border-0">
                      <h4 className="font-medium text-sm">{dept.name}</h4>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {dept.phone}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {dept.email}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {dept.hours}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Chat */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Live Chat Support</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Available Mon-Fri, 8 AM - 5 PM
                </p>
                <Button className="w-full" data-testid="button-start-chat">
                  Start Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}