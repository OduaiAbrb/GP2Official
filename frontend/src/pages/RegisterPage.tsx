import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import {
  User,
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Shield,
  Sparkles
} from 'lucide-react';
import { ROLE_OPTIONS } from '@/constants/roles';

export const RegisterPage: React.FC = () => {
  const navigate                        = useNavigate();
  const { register, isLoading, error }  = useAuthStore();
  const [step, setStep]                 = useState(1);
  const [isVisible, setIsVisible]       = useState(false);
  const [formData, setFormData]         = useState({
    full_name: '',
    organization: '',
    role: 'program_manager',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const passwordChecks = useMemo(() => ({
    length:    formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number:    /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const validateEmail   = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const step1Valid = formData.full_name.length >= 2 && formData.organization.length >= 2;
  const step2Valid = validateEmail(formData.email) && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2Valid) return;
    try {
      await register(formData);
      navigate('/projects');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const trustBadges = [
    { icon: Rocket,   label: 'Quick Setup',     desc: 'Get started in 2 minutes' },
    { icon: Sparkles, label: 'AI-Powered',       desc: 'Smart planning intelligence' },
    { icon: Shield,   label: 'Enterprise Ready', desc: 'Bank-level security' },
  ];

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#0c0702' }}>

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(212,160,23,0.15) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-10"
          style={{ top: '10%', left: '20%', backgroundColor: 'rgba(212,160,23,0.3)' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-8"
          style={{ bottom: '20%', right: '30%', backgroundColor: 'rgba(139,94,60,0.3)' }} />
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, rgba(212,160,23,0.06), #0c0702, #0c0702)' }} />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 w-full">
          {/* Logo */}
          <div className={`flex items-center gap-4 mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                style={{ background: 'linear-gradient(to bottom right, #D4A017, #8B5E3C)' }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl text-3xl"
                style={{ background: 'linear-gradient(to bottom right, #D4A017, #b8860b)' }}>
                🌰
              </div>
            </div>
            <span className="text-4xl font-bold"
              style={{ background: 'linear-gradient(to right, #D4A017, #e8bf40)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Acorn
            </span>
          </div>

          {/* Headline */}
          <h1 className={`text-5xl xl:text-6xl font-bold text-[#f0e4c8] leading-[1.1] mb-8 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Plant the Seed of
            <span className="block mt-3"
              style={{ background: 'linear-gradient(to right, #D4A017, #e8bf40)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Your Next Project
            </span>
          </h1>

          <p className={`text-xl text-[#8a7055] mb-16 max-w-lg leading-relaxed transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            Transform complex requirements into a living, growing plan with AI-powered project planning.
          </p>

          {/* Trust Badges */}
          <div className={`space-y-4 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: 'rgba(61,36,18,0.4)',
                  border: '1px solid rgba(212,160,23,0.2)',
                  transitionDelay: `${index * 100}ms`
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(to bottom right, rgba(212,160,23,0.2), rgba(139,94,60,0.15))' }}>
                  <badge.icon className="w-6 h-6" style={{ color: '#D4A017' }} />
                </div>
                <div>
                  <p className="font-semibold text-[#f0e4c8]">{badge.label}</p>
                  <p className="text-sm text-[#8a7055]">{badge.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(to bottom right, #D4A017, #b8860b)' }}>
                🌰
              </div>
              <span className="text-2xl font-bold"
                style={{ background: 'linear-gradient(to right, #D4A017, #e8bf40)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Acorn
              </span>
            </Link>
          </div>

          {/* Progress Steps */}
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center gap-4">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${step >= s ? 'scale-110' : ''}`}
                      style={{
                        background: step >= s ? 'linear-gradient(to bottom right, #D4A017, #b8860b)' : '#3d2412',
                        color: step >= s ? '#0c0702' : '#8a7055',
                        boxShadow: step >= s ? '0 10px 25px -5px rgba(212,160,23,0.35)' : 'none'
                      }}>
                      {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${step >= s ? 'text-[#f0e4c8]' : 'text-[#8a7055]'}`}>
                      {s === 1 ? 'Profile' : 'Account'}
                    </span>
                  </div>
                  {s < 2 && (
                    <div className="w-16 h-1 rounded-full transition-all duration-500"
                      style={{ backgroundColor: step >= 2 ? '#D4A017' : '#3d2412' }} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Register Card */}
          <div className={`rounded-3xl p-8 backdrop-blur-xl transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              backgroundColor: 'rgba(26,16,8,0.92)',
              border: '1px solid #3d2412',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)'
            }}>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#f0e4c8] mb-2">
                {step === 1 ? 'Create Your Profile' : 'Secure Your Account'}
              </h1>
              <p className="text-[#8a7055]">
                {step === 1 ? 'Tell us about yourself' : 'Set up your login credentials'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-medium text-[#c8b090] mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a7055] group-focus-within:text-[#D4A017] transition-colors" />
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="John Doe"
                        data-testid="register-fullname-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[#f0e4c8] placeholder-[#8a7055] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                        style={{ backgroundColor: '#1a1008', border: '1px solid #3d2412' }}
                      />
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-[#c8b090] mb-2">Organization</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a7055] group-focus-within:text-[#D4A017] transition-colors" />
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Your Company"
                        data-testid="register-org-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[#f0e4c8] placeholder-[#8a7055] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                        style={{ backgroundColor: '#1a1008', border: '1px solid #3d2412' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c8b090] mb-2">Your Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      data-testid="register-role-select"
                      className="w-full px-4 py-4 rounded-xl text-[#f0e4c8] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                      style={{ backgroundColor: '#1a1008', border: '1px solid #3d2412' }}>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.id} value={role.id} style={{ backgroundColor: '#1a1008' }}>{role.label}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-[#8a7055]">
                      {ROLE_OPTIONS.find((r) => r.id === formData.role)?.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => step1Valid && setStep(2)}
                    disabled={!step1Valid}
                    data-testid="register-continue-btn"
                    className="w-full font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{
                      background: 'linear-gradient(to right, #D4A017, #b8860b)',
                      color: '#0c0702',
                      boxShadow: '0 10px 25px -5px rgba(212,160,23,0.3)'
                    }}>
                    Continue
                    <ArrowRight className="ml-2 w-5 h-5 inline group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-sm font-medium text-[#c8b090] mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a7055] group-focus-within:text-[#D4A017] transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => setTouched({ ...touched, email: true })}
                        placeholder="you@example.com"
                        data-testid="register-email-input"
                        className="w-full pl-12 pr-12 py-4 rounded-xl text-[#f0e4c8] placeholder-[#8a7055] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                        style={{
                          backgroundColor: '#1a1008',
                          border: touched.email && !validateEmail(formData.email) && formData.email
                            ? '1px solid rgba(239,68,68,0.5)'
                            : '1px solid #3d2412'
                        }} />
                      {touched.email && validateEmail(formData.email) && (
                        <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4A017]" />
                      )}
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-[#c8b090] mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a7055] group-focus-within:text-[#D4A017] transition-colors" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Create a strong password"
                        data-testid="register-password-input"
                        className="w-full pl-12 pr-4 py-4 rounded-xl text-[#f0e4c8] placeholder-[#8a7055] transition-all focus:outline-none focus:ring-2 focus:ring-[#D4A017]/30"
                        style={{ backgroundColor: '#1a1008', border: '1px solid #3d2412' }} />
                    </div>

                    {formData.password && (
                      <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#1a1008', border: '1px solid #3d2412' }}>
                        <p className="text-xs font-medium text-[#8a7055] mb-3">Password must have:</p>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'length',    label: '8+ characters' },
                            { key: 'uppercase', label: 'Uppercase letter' },
                            { key: 'lowercase', label: 'Lowercase letter' },
                            { key: 'number',    label: 'Number' },
                          ].map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                                style={{
                                  backgroundColor: passwordChecks[key as keyof typeof passwordChecks] ? '#D4A017' : '#3d2412',
                                  transform: passwordChecks[key as keyof typeof passwordChecks] ? 'scale(1.1)' : 'scale(1)'
                                }}>
                                {passwordChecks[key as keyof typeof passwordChecks] && (
                                  <CheckCircle className="w-3 h-3 text-[#0c0702]" />
                                )}
                              </div>
                              <span className={`text-sm transition-colors ${
                                passwordChecks[key as keyof typeof passwordChecks] ? 'text-[#D4A017] font-medium' : 'text-[#8a7055]'
                              }`}>
                                {label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 rounded-xl text-[#c8b090]"
                      style={{ border: '1px solid #3d2412', backgroundColor: 'transparent' }}>
                      <ArrowLeft className="w-4 h-4 mr-2 inline" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !step2Valid}
                      data-testid="register-submit-btn"
                      className="flex-1 font-bold py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(to right, #D4A017, #b8860b)',
                        color: '#0c0702',
                        boxShadow: '0 10px 25px -5px rgba(212,160,23,0.3)'
                      }}>
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-[#0c0702] border-t-transparent rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <>
                          Create Account
                          <Sparkles className="ml-2 w-5 h-5 inline" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-8 text-center pt-6" style={{ borderTop: '1px solid #3d2412' }}>
              <p className="text-[#8a7055]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold hover:underline" style={{ color: '#D4A017' }}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-[#8a7055] hover:text-[#D4A017] transition-colors inline-flex items-center gap-2 group">
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
