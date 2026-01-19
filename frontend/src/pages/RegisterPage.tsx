import React, { useState, useMemo } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { AcornLogo } from '@/components/AcornLogo';
import { ROLE_OPTIONS } from '@/constants/roles';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    role: 'program_manager',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const passwordChecks = useMemo(() => ({
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
  }), [formData.password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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

  const handleNext = () => {
    if (step1Valid) setStep(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-acorn-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fadeIn">
          <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
            <AcornLogo size={56} />
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= 1 ? 'bg-acorn-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className={`text-sm font-medium ${step >= 1 ? 'text-acorn-blue-600' : 'text-gray-400'}`}>
                Profile
              </span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-acorn-blue-500' : 'bg-gray-200'}`}></div>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= 2 ? 'bg-acorn-blue-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <span className={`text-sm font-medium ${step >= 2 ? 'text-acorn-blue-600' : 'text-gray-400'}`}>
                Account
              </span>
            </div>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-slideUp">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Create Your Profile' : 'Set Up Your Account'}
            </h1>
            <p className="text-gray-500">
              {step === 1 ? 'Tell us about yourself' : 'Secure your account'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 && (
              <div className="space-y-5 animate-fadeIn">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Organization */}
                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="organization"
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Your Company"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Role
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 transition-all bg-white"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {ROLE_OPTIONS.find((r) => r.id === formData.role)?.description}
                  </p>
                </div>

                {/* Next Button */}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!step1Valid}
                  className="w-full bg-acorn-blue-500 hover:bg-acorn-blue-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-center gap-2">
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-fadeIn">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={() => setTouched({ ...touched, email: true })}
                      placeholder="you@example.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 transition-all ${
                        touched.email && !validateEmail(formData.email) ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    {touched.email && validateEmail(formData.email) && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {touched.email && !validateEmail(formData.email) && formData.email && (
                    <p className="mt-1 text-sm text-red-500">Please enter a valid email</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a strong password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-acorn-blue-500 focus:border-acorn-blue-500 transition-all"
                    />
                  </div>

                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-600 mb-2">Password must have:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'length', label: '8+ characters' },
                          { key: 'uppercase', label: 'Uppercase letter' },
                          { key: 'lowercase', label: 'Lowercase letter' },
                          { key: 'number', label: 'Number' },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            {passwordChecks[key as keyof typeof passwordChecks] ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span className={`text-xs ${
                              passwordChecks[key as keyof typeof passwordChecks] ? 'text-green-600' : 'text-gray-500'
                            }`}>
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !step2Valid}
                    className="flex-1 bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-acorn-orange-500 hover:text-acorn-orange-600 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-acorn-blue-600 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
};
