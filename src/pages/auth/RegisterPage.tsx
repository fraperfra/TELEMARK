import { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, clearError, error } = useAuth();
  const navigate = useNavigate();

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);

    setPasswordRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    });
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allRequirementsMet = Object.values(passwordRequirements).every((req) => req);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    if (!passwordsMatch) {
      toast.error('Le password non corrispondono');
      setLoading(false);
      return;
    }

    if (!allRequirementsMet) {
      toast.error('Password non rispetta i requisiti di sicurezza');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password, name);
      if (result.success) {
        toast.success('Registrazione effettuata con successo');
        toast.info('Reindirizzamento al login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(result.error || 'Errore durante la registrazione');
      }
    } catch (error: any) {
      toast.error(error.message || 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">T</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Telemarketing
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Crea un nuovo account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Francesco Rossi"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="nome@azienda.it"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-3 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {passwordRequirements.length ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                      <span className="text-xs text-gray-600">Almeno 8 caratteri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.uppercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                      <span className="text-xs text-gray-600">Una lettera maiuscola</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.lowercase ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                      <span className="text-xs text-gray-600">Una lettera minuscola</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.number ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                      <span className="text-xs text-gray-600">Un numero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {passwordRequirements.special ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="h-4 w-4 border border-gray-300 rounded-full" />
                      )}
                      <span className="text-xs text-gray-600">Un carattere speciale</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Conferma Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div className="mt-2">
                  {passwordsMatch ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs">Le password corrispondono</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs">Le password non corrispondono</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              Accetto i{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                termini di servizio
              </a>{' '}
              e la{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500">
                privacy policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch || !allRequirementsMet}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Registrati'
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Hai già un account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Accedi
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
