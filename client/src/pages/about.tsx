import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Building, Users, Target, Award, Calendar, Globe, 
  TrendingUp, Shield, Heart, Briefcase, CheckCircle2
} from 'lucide-react';

const leadership = [
  {
    name: 'Sarah Johnson',
    role: 'City Manager',
    department: 'Executive Office',
    tenure: '2019 - Present'
  },
  {
    name: 'Michael Chen',
    role: 'Finance Director',
    department: 'Finance & Treasury',
    tenure: '2018 - Present'
  },
  {
    name: 'Angela Rodriguez',
    role: 'Public Works Director',
    department: 'Public Works',
    tenure: '2020 - Present'
  },
  {
    name: 'David Thompson',
    role: 'Chief Technology Officer',
    department: 'Information Technology',
    tenure: '2021 - Present'
  }
];

const values = [
  {
    icon: Shield,
    title: 'Transparency',
    description: 'Open and honest governance with full public accountability'
  },
  {
    icon: Heart,
    title: 'Community First',
    description: 'Putting citizen needs at the center of every decision'
  },
  {
    icon: TrendingUp,
    title: 'Innovation',
    description: 'Embracing technology to improve government services'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'Delivering high-quality services efficiently and effectively'
  }
];

const achievements = [
  'AAA Bond Rating maintained for 15 consecutive years',
  'Smart City Award 2023 for Digital Innovation',
  'Best Place to Work in Government 2024',
  'GFOA Distinguished Budget Presentation Award',
  'ISO 27001 Certified for Information Security'
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">About Our Government</h1>
              <p className="mt-2 text-blue-100">Serving our community since 1875</p>
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
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Building a Better Tomorrow, Together</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We are committed to providing exceptional public services, fostering economic growth, 
              and enhancing the quality of life for all residents through responsible governance 
              and innovative solutions.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card data-testid="stat-population">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">250,000+</p>
                <p className="text-sm text-muted-foreground">Residents Served</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-employees">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">2,500+</p>
                <p className="text-sm text-muted-foreground">Government Employees</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-budget">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">$1.2B</p>
                <p className="text-sm text-muted-foreground">Annual Budget</p>
              </CardContent>
            </Card>
            <Card data-testid="stat-services">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-blue-600">100+</p>
                <p className="text-sm text-muted-foreground">Services Offered</p>
              </CardContent>
            </Card>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To deliver exceptional public services that enhance the quality of life for our residents, 
                  promote economic vitality, and ensure a sustainable future for generations to come through 
                  transparent, efficient, and responsive governance.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be a model 21st-century government that sets the standard for innovation, sustainability, 
                  and citizen engagement, creating a thriving community where all people can live, work, 
                  and prosper.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">Our Core Values</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="text-center">
                    <CardContent className="pt-6">
                      <div className="inline-flex p-3 bg-blue-100 rounded-full mb-4">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold mb-2">{value.title}</h4>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Leadership */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">Leadership Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadership.map((leader) => (
                <Card key={leader.name} data-testid={`leader-${leader.name.toLowerCase().replace(/\s+/g, '-')}`}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4" />
                      <h4 className="font-semibold">{leader.name}</h4>
                      <p className="text-sm text-blue-600">{leader.role}</p>
                      <p className="text-xs text-muted-foreground mt-1">{leader.department}</p>
                      <Badge variant="outline" className="mt-2">
                        {leader.tenure}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <Award className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Recognition & Achievements</CardTitle>
              <CardDescription>Awards and certifications earned through excellence in public service</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {achievements.map((achievement) => (
                  <li key={achievement} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{achievement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center mt-12 py-8 bg-blue-50 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">Get Involved</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Your voice matters. Join us in building a better community through civic engagement, 
              public meetings, and volunteer opportunities.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild data-testid="button-meetings">
                <Link href="/news">
                  <Calendar className="mr-2 h-4 w-4" />
                  Public Meetings
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-volunteer">
                <Link href="/contact">
                  <Users className="mr-2 h-4 w-4" />
                  Volunteer
                </Link>
              </Button>
              <Button variant="outline" asChild data-testid="button-careers">
                <Link href="/careers">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Career Opportunities
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}