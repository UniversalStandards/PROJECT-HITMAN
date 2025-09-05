import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building, Phone, Mail, Clock, MapPin, Globe, Users, 
  FileText, Shield, Heart, Car, Home, Scale, BookOpen
} from 'lucide-react';
import { Link } from 'wouter';

const departments = [
  {
    id: 'finance',
    name: 'Finance & Treasury',
    description: 'Budget management, tax collection, and financial reporting',
    icon: Building,
    contact: '555-0100',
    email: 'finance@gov.local',
    services: ['Tax Payments', 'Budget Reports', 'Financial Audits'],
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM'
  },
  {
    id: 'public-works',
    name: 'Public Works',
    description: 'Infrastructure, utilities, and maintenance services',
    icon: Car,
    contact: '555-0101',
    email: 'publicworks@gov.local',
    services: ['Road Maintenance', 'Water Services', 'Waste Management'],
    hours: 'Mon-Fri: 7:00 AM - 4:00 PM'
  },
  {
    id: 'health',
    name: 'Health Department',
    description: 'Public health programs and community wellness',
    icon: Heart,
    contact: '555-0102',
    email: 'health@gov.local',
    services: ['Vaccinations', 'Health Inspections', 'Community Programs'],
    hours: 'Mon-Fri: 8:00 AM - 6:00 PM'
  },
  {
    id: 'housing',
    name: 'Housing & Development',
    description: 'Permits, zoning, and development planning',
    icon: Home,
    contact: '555-0103',
    email: 'housing@gov.local',
    services: ['Building Permits', 'Zoning Applications', 'Housing Assistance'],
    hours: 'Mon-Fri: 8:00 AM - 5:00 PM'
  },
  {
    id: 'legal',
    name: 'Legal Department',
    description: 'Legal services, court administration, and compliance',
    icon: Scale,
    contact: '555-0104',
    email: 'legal@gov.local',
    services: ['Court Services', 'Legal Compliance', 'Public Records'],
    hours: 'Mon-Fri: 8:30 AM - 4:30 PM'
  },
  {
    id: 'education',
    name: 'Education Services',
    description: 'Educational programs and community learning initiatives',
    icon: BookOpen,
    contact: '555-0105',
    email: 'education@gov.local',
    services: ['School Programs', 'Adult Education', 'Library Services'],
    hours: 'Mon-Fri: 7:30 AM - 5:00 PM'
  }
];

const quickLinks = [
  { name: 'Pay Taxes Online', href: '/citizen', icon: Building },
  { name: 'Apply for Permits', href: '/citizen', icon: FileText },
  { name: 'Vendor Registration', href: '/vendor-registration', icon: Users },
  { name: 'Employee Portal', href: '/employee', icon: Shield },
];

export default function PublicServices() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" data-testid="public-services">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Government Services Portal</h1>
              <p className="mt-2 text-blue-100">Your gateway to all government services and information</p>
            </div>
            <div className="flex gap-4">
              <Button variant="secondary" size="lg" asChild data-testid="button-citizen-portal">
                <Link href="/citizen">
                  <Users className="mr-2 h-4 w-4" />
                  Citizen Portal
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-900" asChild data-testid="button-login">
                <Link href="/api/login">
                  Employee Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-blue-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">How can we help you today?</h2>
            <div className="relative">
              <Input
                type="search"
                placeholder="Search for services, departments, or information..."
                className="w-full py-6 px-6 text-lg text-gray-900 rounded-full"
                data-testid="input-search"
              />
              <Button 
                size="lg" 
                className="absolute right-2 top-2 rounded-full"
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.name}
                  variant="outline"
                  size="lg"
                  className="flex items-center gap-2"
                  asChild
                  data-testid={`quicklink-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Link href={link.href}>
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Departments Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Government Departments</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const Icon = dept.icon;
              return (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow" data-testid={`dept-${dept.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <Badge variant="outline">Open</Badge>
                    </div>
                    <CardTitle className="mt-4">{dept.name}</CardTitle>
                    <CardDescription>{dept.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {dept.services.map((service) => (
                            <Badge key={service} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{dept.hours}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{dept.contact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{dept.email}</span>
                        </div>
                      </div>
                      
                      <Button className="w-full mt-4" variant="outline" data-testid={`button-contact-${dept.id}`}>
                        Contact Department
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Important Notices */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Important Notices</h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-l-4 border-l-yellow-500" data-testid="notice-tax">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg h-fit">
                    <Building className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Property Tax Payment Deadline</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Property tax payments for Q1 2024 are due by March 31st. Pay online to avoid late fees.
                    </p>
                    <Button size="sm" className="mt-2" variant="outline" data-testid="button-pay-tax">
                      Pay Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500" data-testid="notice-meeting">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg h-fit">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">City Council Meeting</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next city council meeting scheduled for February 15th at 6:00 PM. Public comments welcome.
                    </p>
                    <Button size="sm" className="mt-2" variant="outline" data-testid="button-view-agenda">
                      View Agenda
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500" data-testid="notice-vendors">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="p-2 bg-green-100 rounded-lg h-fit">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">New Procurement Opportunities</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Multiple RFPs now open for IT services, construction, and professional services.
                    </p>
                    <Button size="sm" className="mt-2" variant="outline" asChild data-testid="button-view-rfps">
                      <Link href="/vendor-registration">View RFPs</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/citizen" className="hover:underline">Pay Bills</Link></li>
                <li><Link href="/citizen" className="hover:underline">Apply for Permits</Link></li>
                <li><Link href="/vendor-registration" className="hover:underline">Vendor Registration</Link></li>
                <li><Link href="/employee" className="hover:underline">Employee Portal</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Departments</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Finance</a></li>
                <li><a href="#" className="hover:underline">Public Works</a></li>
                <li><a href="#" className="hover:underline">Health</a></li>
                <li><a href="#" className="hover:underline">Legal</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  123 Government Plaza
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  (555) 010-0000
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@gov.local
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Connect</h3>
              <div className="flex gap-4">
                <Button size="icon" variant="ghost" className="hover:bg-gray-800" data-testid="social-web">
                  <Globe className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-gray-800" data-testid="social-mail">
                  <Mail className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-gray-800" data-testid="social-phone">
                  <Phone className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© 2024 Government Operations and Financial Accounting Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}