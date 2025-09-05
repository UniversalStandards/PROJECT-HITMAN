import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { 
  Newspaper, Calendar, Clock, MapPin, Users, AlertCircle,
  Building, ChevronRight, Bell, ExternalLink, Download
} from 'lucide-react';

const newsItems = [
  {
    id: '1',
    title: 'New Online Portal Launches for Building Permits',
    category: 'Technology',
    date: '2024-01-15',
    excerpt: 'Residents can now apply for and track building permits entirely online, reducing processing time by 50%.',
    image: null,
    priority: false
  },
  {
    id: '2',
    title: 'Property Tax Payment Deadline - March 31st',
    category: 'Finance',
    date: '2024-01-10',
    excerpt: 'First quarter property taxes are due March 31st. Pay online to avoid late fees and penalties.',
    image: null,
    priority: true
  },
  {
    id: '3',
    title: 'City Council Meeting - February 15th',
    category: 'Meetings',
    date: '2024-01-08',
    excerpt: 'Join us for the monthly city council meeting. Public comments welcome on proposed budget amendments.',
    image: null,
    priority: false
  },
  {
    id: '4',
    title: 'Road Construction on Main Street Begins February 1st',
    category: 'Public Works',
    date: '2024-01-05',
    excerpt: 'Major infrastructure improvements will affect traffic patterns. Alternative routes recommended.',
    image: null,
    priority: true
  },
  {
    id: '5',
    title: 'New Recycling Program Expands to All Neighborhoods',
    category: 'Environment',
    date: '2024-01-03',
    excerpt: 'Enhanced recycling services now available citywide with new accepted materials and pickup schedule.',
    image: null,
    priority: false
  }
];

const events = [
  {
    id: '1',
    title: 'City Council Meeting',
    date: '2024-02-15',
    time: '6:00 PM',
    location: 'City Hall, Council Chambers',
    type: 'Meeting',
    description: 'Monthly city council meeting with public comment period'
  },
  {
    id: '2',
    title: 'Budget Workshop',
    date: '2024-02-20',
    time: '3:00 PM',
    location: 'Government Plaza, Room 200',
    type: 'Workshop',
    description: 'Public workshop on FY2025 budget proposals'
  },
  {
    id: '3',
    title: 'Planning Commission',
    date: '2024-02-22',
    time: '7:00 PM',
    location: 'City Hall, Room 305',
    type: 'Meeting',
    description: 'Review of zoning applications and development proposals'
  },
  {
    id: '4',
    title: 'Community Town Hall',
    date: '2024-03-01',
    time: '6:30 PM',
    location: 'Community Center',
    type: 'Town Hall',
    description: 'Open forum for resident concerns and suggestions'
  },
  {
    id: '5',
    title: 'Parks & Recreation Board',
    date: '2024-03-05',
    time: '5:30 PM',
    location: 'Parks Department',
    type: 'Meeting',
    description: 'Discussion of summer programs and facility improvements'
  }
];

const announcements = [
  {
    id: '1',
    title: 'Water Main Maintenance - February 10-12',
    type: 'alert',
    content: 'Water service will be temporarily interrupted in the downtown area for essential maintenance.'
  },
  {
    id: '2',
    title: 'New Business Grant Program Now Open',
    type: 'info',
    content: 'Small businesses can apply for grants up to $50,000 for expansion and job creation.'
  },
  {
    id: '3',
    title: 'Emergency Alert System Test - February 1st',
    type: 'warning',
    content: 'Monthly test of the emergency alert system will occur at noon. No action required.'
  }
];

export default function News() {
  const [selectedTab, setSelectedTab] = useState('news');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">News & Events</h1>
              <p className="mt-2 text-blue-100">Stay informed about government news, meetings, and announcements</p>
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

      {/* Alert Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium">
              Property tax payments due March 31st - Pay online to avoid late fees
            </span>
            <Button size="sm" variant="link" className="ml-auto" data-testid="button-pay-now">
              Pay Now →
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-8">
            <TabsTrigger value="news" data-testid="tab-news">
              <Newspaper className="mr-2 h-4 w-4" />
              News
            </TabsTrigger>
            <TabsTrigger value="events" data-testid="tab-events">
              <Calendar className="mr-2 h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="announcements" data-testid="tab-announcements">
              <Bell className="mr-2 h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          {/* News Tab */}
          <TabsContent value="news" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main News */}
              <div className="lg:col-span-2 space-y-4">
                {newsItems.map((item) => (
                  <Card key={item.id} data-testid={`news-${item.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={item.priority ? "destructive" : "secondary"}>
                              {item.category}
                            </Badge>
                            {item.priority && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Important
                              </Badge>
                            )}
                          </div>
                          <CardTitle>{item.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">{item.excerpt}</p>
                      <Button variant="link" className="px-0" data-testid={`button-read-more-${item.id}`}>
                        Read More <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Subscribe */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Stay Updated</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get news and announcements delivered to your inbox
                    </p>
                    <Button className="w-full" data-testid="button-subscribe">
                      <Bell className="mr-2 h-4 w-4" />
                      Subscribe to Updates
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-archive">
                      <Link href="#">
                        <Newspaper className="mr-2 h-4 w-4" />
                        News Archive
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-meetings">
                      <Link href="#">
                        <Users className="mr-2 h-4 w-4" />
                        Meeting Minutes
                      </Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" asChild data-testid="link-agendas">
                      <Link href="#">
                        <Download className="mr-2 h-4 w-4" />
                        Download Agendas
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} data-testid={`event-${event.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge>{event.type}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <p className="text-muted-foreground">{event.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" data-testid={`button-event-details-${event.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="bg-gray-50">
              <CardContent className="pt-6 text-center">
                <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  View all upcoming events and add them to your calendar
                </p>
                <Button className="mt-4" variant="outline" data-testid="button-full-calendar">
                  View Full Calendar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Announcements Tab */}
          <TabsContent value="announcements" className="space-y-4">
            {announcements.map((announcement) => (
              <Card 
                key={announcement.id}
                className={
                  announcement.type === 'alert' ? 'border-red-200 bg-red-50' :
                  announcement.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }
                data-testid={`announcement-${announcement.id}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${
                      announcement.type === 'alert' ? 'text-red-600' :
                      announcement.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`} />
                    <div>
                      <h3 className="font-semibold mb-1">{announcement.title}</h3>
                      <p className="text-sm text-muted-foreground">{announcement.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card>
              <CardContent className="pt-6 text-center">
                <Bell className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Get Instant Alerts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sign up for text or email alerts for emergency notifications and important updates
                </p>
                <Button data-testid="button-signup-alerts">
                  Sign Up for Alerts
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}