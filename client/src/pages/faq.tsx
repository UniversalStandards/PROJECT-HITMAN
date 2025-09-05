import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import SearchBar from '@/components/ui/search-bar';
import { 
  HelpCircle, Building, CreditCard, FileText, Users, Shield, 
  Car, Home, Phone, Mail, MessageSquare, ArrowRight
} from 'lucide-react';

const faqCategories = {
  'General': {
    icon: HelpCircle,
    questions: [
      {
        question: 'What are the government office hours?',
        answer: 'Most government offices are open Monday through Friday, 8:00 AM to 5:00 PM. Some departments like Public Works may have different hours. Emergency services are available 24/7.'
      },
      {
        question: 'How do I contact my local representative?',
        answer: 'You can find contact information for all elected officials on our website under the "Government" section, or call (555) 010-0000 for assistance.'
      },
      {
        question: 'Where can I find public meeting schedules?',
        answer: 'All public meetings are posted on our website calendar at least 72 hours in advance. You can also sign up for email notifications about upcoming meetings.'
      },
      {
        question: 'How do I request public records?',
        answer: 'Submit a Public Records Request form online or visit the City Clerk\'s office. Most requests are fulfilled within 5-10 business days.'
      },
      {
        question: 'What services are available online?',
        answer: 'Over 80% of our services are available online, including tax payments, permit applications, utility bills, and license renewals. Visit our Services Directory for a complete list.'
      }
    ]
  },
  'Payments & Taxes': {
    icon: CreditCard,
    questions: [
      {
        question: 'How do I pay my property taxes?',
        answer: 'Property taxes can be paid online through our secure portal, by mail, or in person at the Treasury office. We accept credit cards, debit cards, eChecks, and cash.'
      },
      {
        question: 'When are property taxes due?',
        answer: 'Property taxes are due twice a year - March 31st and September 30th. Late payments incur a 1.5% monthly penalty.'
      },
      {
        question: 'Can I set up automatic payments for utilities?',
        answer: 'Yes, you can enroll in AutoPay through your online account. Payments will be automatically deducted from your bank account or charged to your credit card each month.'
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept credit cards (Visa, MasterCard, American Express), debit cards, eChecks, cash, and money orders. Personal checks are accepted for amounts under $5,000.'
      },
      {
        question: 'How do I dispute a charge or fee?',
        answer: 'Contact the department that issued the charge within 30 days. You can file a formal dispute online or submit a written request to the Finance Department.'
      }
    ]
  },
  'Permits & Licenses': {
    icon: FileText,
    questions: [
      {
        question: 'Do I need a permit for home renovations?',
        answer: 'Most structural changes, electrical work, plumbing modifications, and additions require permits. Minor cosmetic changes like painting usually don\'t. Contact Building Services if unsure.'
      },
      {
        question: 'How long does permit approval take?',
        answer: 'Simple permits are typically approved within 5-7 business days. Complex projects may take 2-4 weeks. Expedited service is available for an additional fee.'
      },
      {
        question: 'How do I renew my business license?',
        answer: 'Business licenses can be renewed online up to 60 days before expiration. You\'ll receive a renewal notice by mail and email 90 days before your license expires.'
      },
      {
        question: 'What documents are needed for a building permit?',
        answer: 'You\'ll need completed application forms, detailed plans/drawings, contractor information, and proof of insurance. Specific requirements vary by project type.'
      },
      {
        question: 'Can I check my permit status online?',
        answer: 'Yes, you can track your permit application status online using your permit number or address. Status updates are provided at each stage of review.'
      }
    ]
  },
  'Public Services': {
    icon: Car,
    questions: [
      {
        question: 'How do I report a pothole or street issue?',
        answer: 'Report street issues online through our 311 service portal, call (555) 010-0311, or use our mobile app. Include the exact location and a photo if possible.'
      },
      {
        question: 'What is the trash collection schedule?',
        answer: 'Trash is collected weekly on your designated day based on your address. Recycling is collected bi-weekly. Check our website for your specific collection day.'
      },
      {
        question: 'How do I request bulk item pickup?',
        answer: 'Schedule bulk item pickup online or by calling (555) 010-0200. You\'re entitled to 2 free pickups per year. Additional pickups cost $50 each.'
      },
      {
        question: 'How do I report a water leak or outage?',
        answer: 'For emergencies, call our 24/7 hotline at (555) 010-0911. For non-emergencies, report online or call during business hours.'
      },
      {
        question: 'Are there restrictions on yard waste disposal?',
        answer: 'Yard waste must be in biodegradable bags or marked containers. It\'s collected April through November on your regular trash day.'
      }
    ]
  },
  'Vendors & Contracts': {
    icon: Users,
    questions: [
      {
        question: 'How do I become a registered vendor?',
        answer: 'Complete the vendor registration form online, provide required documentation (W-9, insurance certificates, business license), and submit for approval. Processing takes 5-10 business days.'
      },
      {
        question: 'Where are RFPs and bids posted?',
        answer: 'All procurement opportunities are posted on our Vendor Portal. You can also sign up for email alerts based on your business categories.'
      },
      {
        question: 'What are the payment terms for vendors?',
        answer: 'Standard payment terms are Net 30 days from invoice approval. Electronic payments are processed weekly. Paper checks are issued bi-weekly.'
      },
      {
        question: 'How do I update my vendor information?',
        answer: 'Log into the Vendor Portal to update contact information, banking details, certifications, and business categories. Changes are reviewed within 2 business days.'
      },
      {
        question: 'Are there opportunities for small businesses?',
        answer: 'Yes, we have a Small Business Enterprise program with set-aside contracts and procurement goals. Certification is required to participate.'
      }
    ]
  },
  'Emergency & Safety': {
    icon: Shield,
    questions: [
      {
        question: 'What number do I call for emergencies?',
        answer: 'Call 911 for all life-threatening emergencies. For non-emergencies, call (555) 010-0222 for police or (555) 010-0333 for fire services.'
      },
      {
        question: 'How do I sign up for emergency alerts?',
        answer: 'Register for emergency alerts online or text ALERTS to 55555. You can choose to receive notifications via text, email, or voice call.'
      },
      {
        question: 'Where are emergency shelters located?',
        answer: 'Emergency shelter locations are activated as needed and announced through our alert system. Primary locations include schools and community centers.'
      },
      {
        question: 'How do I request a police report?',
        answer: 'Police reports can be requested online for a $10 fee, or in person at the Police Department Records Division. Reports are typically available within 5-7 business days.'
      },
      {
        question: 'What should I do during severe weather?',
        answer: 'Follow instructions from emergency alerts. Have an emergency kit ready. Know your evacuation zone. Updates are posted on our website and social media channels.'
      }
    ]
  }
};

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');

  // Filter FAQs based on search
  const filteredFAQs = searchQuery
    ? Object.entries(faqCategories).reduce((acc, [category, data]) => {
        const filtered = data.questions.filter(
          q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = { ...data, questions: filtered };
        }
        return acc;
      }, {} as typeof faqCategories)
    : { [selectedCategory]: faqCategories[selectedCategory] };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-900 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
              <p className="mt-2 text-blue-100">Find answers to common questions about government services</p>
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

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar
            placeholder="Search for answers..."
            onSearch={setSearchQuery}
            autoFocus
          />
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
              {Object.keys(faqCategories).map(category => {
                const Icon = faqCategories[category].icon;
                return (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="flex items-center gap-2"
                    data-testid={`tab-${category.toLowerCase()}`}
                  >
                    <Icon className="h-4 w-4" />
                    {category}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}

        {/* FAQ Content */}
        <div className="space-y-6">
          {Object.entries(filteredFAQs).map(([category, data]) => {
            const Icon = data.icon;
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-blue-600" />
                    {category}
                  </CardTitle>
                  {searchQuery && (
                    <CardDescription>
                      Found {data.questions.length} matching question(s)
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {data.questions.map((faq, index) => (
                      <AccordionItem 
                        key={index} 
                        value={`${category}-${index}`}
                        data-testid={`faq-${category.toLowerCase()}-${index}`}
                      >
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Still Need Help */}
        <Card className="mt-12 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Can't find the answer you're looking for? Our customer service team is here to help.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button asChild data-testid="button-contact">
                  <Link href="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Us
                  </Link>
                </Button>
                <Button variant="outline" asChild data-testid="button-call">
                  <a href="tel:5550100000">
                    <Phone className="mr-2 h-4 w-4" />
                    Call (555) 010-0000
                  </a>
                </Button>
                <Button variant="outline" data-testid="button-live-chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Start Live Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}