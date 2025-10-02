/**
 * Landing page
 */
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  const features = [
    {
      icon: '🏢',
      title: 'Franchise Management',
      description: 'Manage multiple franchise locations with ease',
    },
    {
      icon: '📍',
      title: 'Branch Control',
      description: 'Organize branches and track performance',
    },
    {
      icon: '💈',
      title: 'Barber Scheduling',
      description: 'Schedule barbers and manage availability',
    },
    {
      icon: '✂️',
      title: 'Service Catalog',
      description: 'Create and manage service offerings',
    },
    {
      icon: '🔐',
      title: 'Role-Based Access',
      description: 'Secure permissions for different user roles',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Real-time insights and statistics',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="text-6xl mb-6">💈</div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            BarberApp
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Complete barbershop management system with franchise support,
            scheduling, and role-based access control
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/login">
              <Button size="lg" className="text-lg px-8">
                Get Started →
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="ghost" className="text-lg px-8">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need to manage your barbershop business
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Built with modern technologies
          </h2>
          <div className="flex flex-wrap justify-center gap-6 text-gray-600">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold">⚛️ React 18</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold">🔥 Firebase</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold">📱 Capacitor</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold">🎨 Tailwind CSS</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <span className="font-semibold">📘 TypeScript</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of barbershops managing their business with BarberApp
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t border-gray-200">
        <div className="text-center text-gray-600">
          <p>© 2025 BarberApp. Built with ❤️ and Firebase.</p>
        </div>
      </footer>
    </div>
  );
}
