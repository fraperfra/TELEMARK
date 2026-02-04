// src/pages/DiagnosticsPage.tsx
/**
 * Diagnostics Page
 * 
 * Pagina per testare e debuggare la connessione tra app, GitHub e Supabase
 * Accedi su: http://localhost:3004/diagnostics
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { runAllTests, TestResult } from '@/lib/test-supabase';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRunTests = async () => {
    setLoading(true);
    const testResults = await runAllTests();
    setResults(testResults);
    setLoading(false);
  };

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🧪 Diagnostics</h1>
          <p className="text-gray-600 mt-2">Test la connessione tra app, GitHub e Supabase</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Environment</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {import.meta.env.MODE === 'production' ? '🔴 Production' : '🟢 Development'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Supabase</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {import.meta.env.VITE_SUPABASE_URL ? '✅ Configured' : '❌ Missing'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">API URL</p>
                <p className="text-sm font-mono text-gray-900 mt-1 break-all">
                  {import.meta.env.VITE_API_URL || 'Not configured'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Button */}
        <div className="mb-8">
          <Button
            onClick={handleRunTests}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Running Tests...' : '▶️ Run Diagnostics'}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-600">Passed</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">✅ {passed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Failed</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">❌ {failed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">📊 {results.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Results */}
            <div className="space-y-3">
              {results.map((result, idx) => (
                <Card key={idx} className={result.status === 'pass' ? 'border-green-200' : 'border-red-200'}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {result.status === 'pass' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{result.name}</h3>
                        <p className="text-gray-600 mt-1">{result.message}</p>
                        {result.details && (
                          <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded text-sm overflow-auto max-h-48">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8 bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>ℹ️</span> Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>GitHub Repository:</strong>{' '}
              <a href="https://github.com/fraperfra/TELEMARKETING" className="text-blue-600 hover:underline">
                https://github.com/fraperfra/TELEMARKETING
              </a>
            </p>
            <p>
              <strong>Supabase Project:</strong>{' '}
              <a href="https://app.supabase.com" className="text-blue-600 hover:underline">
                https://app.supabase.com
              </a>
            </p>
            <p>
              <strong>Frontend Port:</strong> http://localhost:3004
            </p>
            <p>
              <strong>Backend Port:</strong> http://localhost:3001/api
            </p>
            <p className="text-gray-700 bg-white p-3 rounded border border-amber-200">
              💡 Se i test falliscono, verifica:<br />
              1. Le variabili d'ambiente in <code>.env.local</code>
              <br />
              2. La connessione a internet
              <br />
              3. Lo stato di Supabase su <code>status.supabase.com</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
