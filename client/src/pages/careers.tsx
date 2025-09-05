import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { 
  Briefcase, Building, DollarSign, MapPin, Clock, Users, 
  Search, Heart, Shield, Award, ChevronRight, ExternalLink
} from 'lucide-react';

const jobOpenings = [
  {
    id: '1',
    title: 'Senior Financial Analyst',
    department: 'Finance & Treasury',
    type: 'Full-time',
    location: 'Government Plaza',
    salary: '$65,000 - $85,000',
    posted: '2024-01-10',
    closing: '2024-02-10'
  },
  {
    id: '2',
    title: 'IT Systems Administrator',
    department: 'Information Technology',
    type: 'Full-time',
    location: 'Government Plaza',
    salary: '$70,000 - $90,000',
    posted: '2024-01-08',
    closing: '2024-02-08'
  },
  {
    id: '3',
    title: 'Civil Engineer',
    department: 'Public Works',
    type: 'Full-time',
    location: 'Service Center',
    salary: '$75,000 - $95,000',
    posted: '2024-01-05',
    closing: '2024-02-05'
  },
  {
    id: '4',
    title: 'Administrative Assistant',
    department: 'City Manager Office',
    type: 'Full-time',
    location: 'Government Plaza',
    salary: '$40,000 - $50,000',
    posted: '2024-01-03',
    closing: '2024-02-03'
  },
  {
    id: '5',
    title: 'Building Inspector',
    department: 'Building Services',
    type: 'Full-time',
    location: 'Field',
    salary: '$55,000 - $70,000',
    posted: '2024-01-02',
    closing: '2024-02-02'
  },
  {
    id: '6',
    title: 'Parks Maintenance Worker',
    department: 'Parks & Recreation',
    type: 'Seasonal',
    location: 'Various',
    salary: '$18 - $22 per hour',
    posted: '2024-01-01',
    closing: '2024-03-01'
  }
];

const benefits = [
  { icon: Heart, title: 'Health Insurance', description: 'Comprehensive medical, dental, and vision coverage' },
  { icon: Shield, title: 'Retirement Plan', description: 'Pension and 401(k) with employer matching' },
  { icon: Clock, title: 'Work-Life Balance', description: 'Flexible schedules and generous PTO' },
  { icon: Award, title: 'Professional Development', description: 'Training programs and tuition reimbursement' },
];

export default function Careers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredJobs = jobOpenings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchesType = selectedType === 'all' || job.type === selectedType;
    return matchesSearch && matchesDepartment && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Career Opportunities</h1>
              <p className="mt-2 text-blue-100">Join our team and serve your community</p>
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

      {/* Hero Section */}
      <section className="bg-blue-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Build Your Career in Public Service</h2>
          <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
            Make a difference in your community while building a rewarding career with excellent benefits, 
            job security, and opportunities for growth.
          </p>
          <div className="flex gap-4 justify-center">
            <Badge variant="secondary" className="text-lg py-2 px-4">
              <Users className="mr-2 h-4 w-4" />
              {jobOpenings.length} Open Positions
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              <Building className="mr-2 h-4 w-4" />
              15+ Departments
            </Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search positions..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-jobs"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Finance & Treasury">Finance & Treasury</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Public Works">Public Works</SelectItem>
                  <SelectItem value="Parks & Recreation">Parks & Recreation</SelectItem>
                  <SelectItem value="Building Services">Building Services</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Seasonal">Seasonal</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Cards */}
          <div className="lg:col-span-2 space-y-4">
            {filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No positions match your search criteria.</p>
                </CardContent>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <Card key={job.id} data-testid={`job-${job.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription className="mt-1">{job.department}</CardDescription>
                      </div>
                      <Badge variant={job.type === 'Full-time' ? 'default' : 'secondary'}>
                        {job.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Posted {new Date(job.posted).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        Closes {new Date(job.closing).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1" data-testid={`button-apply-${job.id}`}>
                        Apply Now
                      </Button>
                      <Button variant="outline" data-testid={`button-details-${job.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Why Work With Us?</CardTitle>
                <CardDescription>Great benefits and work environment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={benefit.title} className="flex gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg h-fit">
                        <Icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{benefit.title}</h4>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Application Process */}
            <Card>
              <CardHeader>
                <CardTitle>Application Process</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>Submit online application</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Phone or video screening</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>In-person interview</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <span>Background check</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                      5
                    </span>
                    <span>Job offer</span>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {/* Job Alerts */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6 text-center">
                <Briefcase className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Get Job Alerts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to know about new opportunities
                </p>
                <Button className="w-full" data-testid="button-job-alerts">
                  Sign Up for Alerts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}