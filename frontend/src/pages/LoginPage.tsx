import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Mail, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  Building2,
  Award
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (isAuthenticated) {
      navigate('/projects');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      setLoginSuccess(true);
      setTimeout(() => navigate('/projects'), 500);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const trustBadges = [
    { icon: Shield, label: 'Enterprise Security' },
    { icon: Building2, label: 'SOC 2 Compliant' },
    { icon: Award, label: 'ISO 27001' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="glow-orb glow-orb-gold w-[600px] h-[600px]" style={{ top: '10%', left: '20%' }} />
        <div className="glow-orb glow-orb-navy w-[500px] h-[500px]" style={{ bottom: '20%', right: '30%' }} />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 via-[#0a0f1a] to-[#0a0f1a]" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          {/* Logo */}
          <div className={`flex items-center gap-4 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37] to-[#9a7b24] rounded-2xl blur-xl opacity-50" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-2xl flex items-center justify-center shadow-2xl">
                <Sparkles className="w-8 h-8 text-[#0a0f1a]" />
              </div>
            </div>
            <span className="text-4xl font-bold text-gradient-gold">Acorn</span>
          </div>

          {/* Headline */}
          <h1 className={`text-5xl xl:text-6xl font-bold text-white leading-[1.1] mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Welcome Back to
            <span className="block text-gradient-gold mt-3">Enterprise Planning</span>
          </h1>

          <p className={`text-xl text-gray-400 mb-16 max-w-lg leading-relaxed transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Continue transforming complex project requirements into actionable plans with AI-powered intelligence.
          </p>

          {/* Trust Badges */}
          <div className={`flex items-center gap-6 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {trustBadges.map((badge, index) => {
              const Icon = badge.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111b2e]/50 border border-[#1e3a5f]/50"
                >
                  <Icon className="w-5 h-5 text-[#d4af37]" />
                  <span className="text-sm font-medium text-gray-300">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Decorative Line */}
        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#d4af37]/30 to-transparent" />
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div 
          className={`w-full max-w-md transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
          style={{ transitionDelay: '400ms' }}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#d4af37] to-[#b8962e] rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-[#0a0f1a]" />
            </div>
            <span className="text-2xl font-bold text-gradient-gold">Acorn</span>
          </div>

          {/* Form Card */}
          <div className="card-glass p-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">Sign In</h2>
              <p className="text-gray-400">Access your enterprise workspace</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 animate-reveal-up">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {loginSuccess && (
              <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 animate-reveal-up">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-green-400 text-sm font-medium">Login successful! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 block">Email Address</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-[#d4af37]' : 'text-gray-500'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input pl-12"
                    placeholder="you@company.com"
                    data-testid="login-email-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300 block">Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-[#d4af37]' : 'text-gray-500'
                  }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="input pl-12 pr-12"
                    placeholder="••••••••"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-[#1e3a5f] bg-[#111b2e] text-[#d4af37] focus:ring-[#d4af37]/30 focus:ring-offset-0"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm text-[#d4af37] hover:text-[#e6c358] transition-colors font-medium">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || loginSuccess}
                className="w-full btn-primary py-4 text-base group disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="login-submit-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Success!
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e3a5f]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#0d1525] text-gray-500">New to Acorn?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="block w-full btn-secondary py-4 text-center"
            >
              Create Enterprise Account
            </Link>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-10">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[#d4af37] hover:text-[#e6c358] transition-colors">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-[#d4af37] hover:text-[#e6c358] transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
