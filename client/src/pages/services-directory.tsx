import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import SearchBar from '@/components/ui/search-bar';
import { 
  Building, Car, Heart, Home, Scale, BookOpen, Shield, Users,
  FileText, DollarSign, Briefcase, Globe, Phone, ArrowRight,
  Clock, MapPin, CreditCard, Zap, CheckCircle2
} from 'lucide-react';

const serviceCategories = {
  'Payments & Taxes': {
    icon: DollarSign,
    services: [
      { name: 'Property Tax Payment', description: 'Pay property taxes online or in person', online: true, fee: false },
      { name: 'Utility Bill Payment', description: 'Pay water, sewer, and trash bills', online: true, fee: false },
      { name: 'Business License', description: 'Apply for or renew business licenses', online: true, fee: true },
      { name: 'Parking Permits', description: 'Purchase residential or commercial parking permits', online: true, fee: true },
      { name: 'Court Fines & Fees', description: 'Pay traffic tickets and court-ordered fines', online: true, fee: false }
    ]
  },
  'Permits & Applications': {
    icon: FileText,
    services: [
      { name: 'Building Permits', description: 'Apply for construction and renovation permits', online: true, fee: true },
      { name: 'Event Permits', description: 'Request permits for public events and gatherings', online: true, fee: true },
      { name: 'Zoning Applications', description: 'Submit zoning variance and special use requests', online: false, fee: true },
      { name: 'Business Registration', description: 'Register a new business with the city', online: true, fee: true },
      { name: 'Vendor Licenses', description: 'Apply for street vendor and mobile business licenses', online: true, fee: true }
    ]
  },
  'Public Safety': {
    icon: Shield,
    services: [
      { name: 'Police Reports', description: 'Request copies of police reports and accident reports', online: true, fee: true },
      { name: 'Background Checks', description: 'Request criminal background checks for employment', online: false, fee: true },
      { name: 'Emergency Alerts', description: 'Sign up for emergency notifications and alerts', online: true, fee: false },
      { name: 'Neighborhood Watch', description: 'Register or join a neighborhood watch program', online: true, fee: false },
      { name: 'Fire Inspections', description: 'Schedule fire safety inspections for businesses', online: true, fee: false }
    ]
  },
  'Health & Human Services': {
    icon: Heart,
    services: [
      { name: 'Health Permits', description: 'Apply for food service and health permits', online: true, fee: true },
      { name: 'Vital Records', description: 'Request birth, death, and marriage certificates', online: true, fee: true },
      { name: 'Senior Services', description: 'Access programs and resources for seniors', online: false, fee: false },
      { name: 'Mental Health Resources', description: 'Find mental health support and counseling services', online: false, fee: false },
      { name: 'Housing Assistance', description: 'Apply for affordable housing and rental assistance', online: true, fee: false }
    ]
  },
  'Public Works': {
    icon: Car,
    services: [
      { name: 'Street Maintenance', description: 'Report potholes, streetlight outages, and road issues', online: true, fee: false },
      { name: 'Waste Collection', description: 'Schedule bulk pickup and special waste disposal', online: true, fee: false },
      { name: 'Water Service', description: 'Start, stop, or transfer water service', online: true, fee: false },
      { name: 'Tree Services', description: 'Request tree trimming or removal on public property', online: true, fee: false },
      { name: 'Snow Removal', description: 'Report snow removal issues and priority routes', online: true, fee: false }
    ]
  },
  'Parks & Recreation': {
    icon: Users,
    services: [
      { name: 'Facility Rentals', description: 'Reserve parks, pavilions, and community centers', online: true, fee: true },
      { name: 'Recreation Programs', description: 'Register for sports leagues and fitness classes', online: true, fee: true },
      { name: 'Pool Passes', description: 'Purchase seasonal pool and aquatic center passes', online: true, fee: true },
      { name: 'Park Permits', description: 'Obtain permits for park events and activities', online: true, fee: true },
      { name: 'Youth Programs', description: 'Enroll in after-school and summer programs', online: true, fee: true }
    ]
  }
};

export default function ServicesDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredServices = Object.entries(serviceCategories).reduce((acc, [category, data]) => {
    const filtered = data.services.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (selectedCategory === 'all' || selectedCategory === category) {
      if (filtered.length > 0) {
        acc[category] = { ...data, services: filtered };
      }
    }
    
    return acc;
  }, {} as typeof serviceCategories);

  const totalServices = Object.values(serviceCategories).reduce(
    (sum, cat) => sum + cat.services.length, 0
  );

  const onlineServices = Object.values(serviceCategories).reduce(
    (sum, cat) => sum + cat.services.filter(s => s.online).length, 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Services Directory</h1>
              <p className="mt-2 text-blue-100">Complete catalog of government services and programs</p>
            </div>
            <Button variant="secondary" asChild data-testid="button-home">
              <Link href="/">
                <Building className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-6 items-center justify-center text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{totalServices}</p>
              <p className="text-sm text-muted-foreground">Total Services</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{onlineServices}</p>
              <p className="text-sm text-muted-foreground">Available Online</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">24/7</p>
              <p className="text-sm text-muted-foreground">Online Access</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">6</p>
              <p className="text-sm text-muted-foreground">Service Categories</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="max-w-2xl mx-auto">
            <SearchBar
              placeholder="Search for services..."
              onSearch={setSearchQuery}
              className="mb-6"
              autoFocus
            />
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto">
              <TabsTrigger value="all" data-testid="tab-all">All Services</TabsTrigger>
              {Object.keys(serviceCategories).map(category => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  data-testid={`tab-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category.split(' & ')[0]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Services Grid */}
        {Object.keys(filteredServices).length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">No services found matching your search.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(filteredServices).map(([category, categoryData]) => {
              const Icon = categoryData.icon;
              return (
                <div key={category}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <Badge variant="secondary">
                      {categoryData.services.length} services
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryData.services.map((service) => (
                      <Card 
                        key={service.name} 
                        className="hover:shadow-md transition-shadow"
                        data-testid={`service-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                            <div className="flex gap-2">
                              {service.online && (
                                <Badge variant="default" className="text-xs">
                                  <Zap className="mr-1 h-3 w-3" />
                                  Online
                                </Badge>
                              )}
                              {service.fee && (
                                <Badge variant="secondary" className="text-xs">
                                  <CreditCard className="mr-1 h-3 w-3" />
                                  Fee
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription className="text-sm mt-1">
                            {service.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            className="w-full" 
                            variant="outline" 
                            size="sm"
                            asChild
                            data-testid={`button-access-${service.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Link href={service.online ? "/citizen" : "/contact"}>
                              {service.online ? 'Access Service' : 'Contact Us'}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <Phone className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Need Help Finding a Service?</h3>
              <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                Our customer service team is available to help you navigate our services and answer any questions.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild data-testid="button-call">
                  <a href="tel:5550100000">
                    <Phone className="mr-2 h-4 w-4" />
                    Call (555) 010-0000
                  </a>
                </Button>
                <Button variant="outline" asChild data-testid="button-contact">
                  <Link href="/contact">
                    <Building className="mr-2 h-4 w-4" />
                    Visit Contact Page
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}