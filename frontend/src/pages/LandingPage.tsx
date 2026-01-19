import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Cpu, 
  CheckCircle, 
  Download,
  ArrowRight,
  Play,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AcornLogo } from '@/components/AcornLogo';

const valueProps = [
  {
    icon: FileText,
    title: 'Smart Requirements',
    description: 'Transform unstructured briefs into IEEE-compliant SRS documents automatically.',
    color: 'bg-acorn-blue-500'
  },
  {
    icon: Cpu,
    title: 'AI-Powered Analysis',
    description: 'Extract entities, identify risks, and generate comprehensive project plans.',
    color: 'bg-acorn-orange-500'
  },
  {
    icon: BarChart3,
    title: 'Visual Diagrams',
    description: 'Auto-generate UML diagrams, flowcharts, and architecture visualizations.',
    color: 'bg-acorn-blue-500'
  },
  {
    icon: Shield,
    title: 'Enterprise Ready',
    description: 'Role-based access, audit trails, and compliance-ready documentation.',
    color: 'bg-acorn-orange-500'
  }
];

const processSteps = [
  {
    step: 1,
    title: 'Input Brief',
    description: 'Paste your project brief or upload existing documents. Use templates for guidance.',
    details: 'Supports plain text, PDF, DOCX, and markdown formats. AI extracts key information automatically.'
  },
  {
    step: 2,
    title: 'AI Generation',
    description: 'Watch as AI analyzes your input and generates structured requirements.',
    details: 'Multi-agent system creates requirements, user stories, UML diagrams, and task breakdowns.'
  },
  {
    step: 3,
    title: 'Review & Export',
    description: 'Edit, refine, and export stakeholder-ready documentation.',
    details: 'Export to PDF, DOCX, or integrate directly with Jira, Trello, and other tools.'
  }
];

const testimonials = [
  {
    quote: 'Acorn reduced our requirements gathering time by 70%. The AI suggestions are remarkably accurate.',
    author: 'Sarah Chen',
    role: 'VP of Engineering, TechFlow',
    rating: 5
  },
  {
    quote: 'Finally, a tool that understands software planning. Our stakeholders love the professional documentation.',
    author: 'Marcus Johnson',
    role: 'Product Director, Innovate Labs',
    rating: 5
  }
];

const integrations = ['Jira', 'Trello', 'Slack', 'GitHub', 'Notion', 'Linear'];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
              <AcornLogo size={44} />
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-acorn-blue-600 font-medium transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-acorn-blue-600 font-medium transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-acorn-blue-600 font-medium transition-colors">Testimonials</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/login')} className="text-acorn-blue-600 font-medium">
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-medium px-6"
              >
                Get Started Free
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 border-t border-gray-100 mt-4 animate-fadeIn">
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-gray-600 font-medium py-2">Features</a>
                <a href="#how-it-works" className="text-gray-600 font-medium py-2">How It Works</a>
                <Button variant="ghost" onClick={() => navigate('/login')} className="justify-start">Sign In</Button>
                <Button onClick={() => navigate('/register')} className="bg-acorn-orange-500 text-white">Get Started Free</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div className="space-y-8 animate-slideUp">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-acorn-blue-50 rounded-full">
                <Zap className="w-4 h-4 text-acorn-orange-500" />
                <span className="text-sm font-medium text-acorn-blue-700">AI-Powered Project Planning</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-acorn-blue-600 leading-tight">
                Transform Briefs Into
                <span className="block text-gray-900">Production-Ready Plans</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Acorn uses AI to convert your project ideas into comprehensive requirements, 
                UML diagrams, and stakeholder-ready documentation in minutes.
              </p>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  onClick={() => navigate('/register')}
                  className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all group"
                >
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-acorn-blue-200 text-acorn-blue-600 hover:bg-acorn-blue-50 px-8 py-4 text-lg font-medium group"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-12 pt-4">
                <div>
                  <p className="text-3xl font-bold text-acorn-blue-600">10K+</p>
                  <p className="text-sm text-gray-500">Projects Created</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-acorn-blue-600">500+</p>
                  <p className="text-sm text-gray-500">Teams Trust Us</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-acorn-blue-600">70%</p>
                  <p className="text-sm text-gray-500">Time Saved</p>
                </div>
              </div>
            </div>

            {/* Right - Illustration */}
            <div className="relative animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <div className="bg-gradient-to-br from-acorn-blue-50 to-acorn-orange-50 rounded-3xl p-8 lg:p-12">
                <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
                  {/* Mock UI */}
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="ml-4 text-sm text-gray-400">Acorn AI</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-acorn-blue-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-acorn-blue-600" />
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-acorn-orange-100 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-acorn-orange-600" />
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded w-3/4 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded w-5/6 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <div className="px-3 py-1 bg-acorn-blue-100 text-acorn-blue-700 rounded-full text-xs font-medium">SRS Ready</div>
                    <div className="px-3 py-1 bg-acorn-orange-100 text-acorn-orange-700 rounded-full text-xs font-medium">UML Generated</div>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Tasks Created</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Cards */}
      <section id="features" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Software Planning
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From initial concept to stakeholder-ready documentation, Acorn handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, index) => (
              <div 
                key={prop.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 ${prop.color} rounded-xl flex items-center justify-center mb-4`}>
                  <prop.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{prop.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How Acorn Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to transform your ideas into action.
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gray-200"></div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div 
                  key={step.step}
                  className="relative animate-fadeIn"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step Number */}
                  <button
                    onClick={() => setActiveStep(activeStep === step.step ? null : step.step)}
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto transition-all cursor-pointer ${
                      activeStep === step.step 
                        ? 'bg-acorn-orange-500 text-white scale-110' 
                        : 'bg-acorn-blue-500 text-white hover:bg-acorn-blue-600'
                    }`}
                  >
                    {step.step}
                  </button>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    
                    {/* Expandable Details */}
                    {activeStep === step.step && (
                      <div className="bg-acorn-blue-50 rounded-lg p-4 text-sm text-acorn-blue-700 animate-fadeIn">
                        {step.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section id="testimonials" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Teams
            </h2>
          </div>

          {/* Testimonial Slider */}
          <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12 mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-acorn-orange-500 text-acorn-orange-500" />
                ))}
              </div>
              <blockquote className="text-2xl text-acorn-blue-600 font-medium mb-6 leading-relaxed">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              <div>
                <p className="font-bold text-gray-900">{testimonials[currentTestimonial].author}</p>
                <p className="text-gray-500">{testimonials[currentTestimonial].role}</p>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-acorn-orange-500 w-6' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6">
              Integrates With Your Favorite Tools
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {integrations.map((name) => (
                <div key={name} className="px-6 py-3 bg-white rounded-lg shadow-sm text-gray-600 font-medium">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Start Building Smarter Projects Today
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Acorn to streamline their software planning process.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/register')}
            className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-bold px-12 py-5 text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-gray-500 mt-4">No credit card required • Free 14-day trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-acorn-blue-600 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <AcornLogo size={40} />
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-acorn-orange-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-acorn-orange-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-acorn-orange-300 transition-colors">Contact</a>
            </div>
            <p className="text-sm text-acorn-blue-200">© 2024 Acorn. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.6s ease-out forwards; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default LandingPage;
