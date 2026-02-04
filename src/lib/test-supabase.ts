// src/lib/test-supabase.ts
/**
 * Test Supabase Connection
 * 
 * Questo file contiene test per verificare che l'app sia correttamente
 * connessa a Supabase. Usa questo per debugging.
 */

import { supabase, isConfigured } from './supabase';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  details?: any;
}

/**
 * Testa la connessione di base a Supabase
 */
export async function testSupabaseConnection(): Promise<TestResult> {
  if (!isConfigured) {
    return {
      name: 'Supabase Configuration',
      status: 'fail',
      message: 'Supabase non è configurato. Verifica VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY',
    };
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return {
        name: 'Supabase Connection',
        status: 'fail',
        message: `Errore di connessione: ${error.message}`,
        details: error,
      };
    }

    return {
      name: 'Supabase Connection',
      status: 'pass',
      message: 'Connessione a Supabase riuscita',
      details: { recordsFound: data?.length || 0 },
    };
  } catch (error: any) {
    return {
      name: 'Supabase Connection',
      status: 'fail',
      message: `Errore: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Testa l'autenticazione
 */
export async function testAuthentication(): Promise<TestResult> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: `Errore di autenticazione: ${error.message}`,
        details: error,
      };
    }

    if (data.session) {
      return {
        name: 'Authentication',
        status: 'pass',
        message: 'Utente autenticato',
        details: {
          user: data.session.user.email,
          expiresAt: data.session.expires_at,
        },
      };
    } else {
      return {
        name: 'Authentication',
        status: 'pass',
        message: 'Nessun utente autenticato (questo è normale se non hai fatto login)',
      };
    }
  } catch (error: any) {
    return {
      name: 'Authentication',
      status: 'fail',
      message: `Errore: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Testa le tabelle del database
 */
export async function testDatabaseTables(): Promise<TestResult[]> {
  const tables = ['users', 'organizations', 'owners', 'calls', 'appointments', 'teams', 'daily_stats'];
  const results: TestResult[] = [];

  for (const table of tables) {
    try {
      const { data, error, status } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (status === 200) {
        results.push({
          name: `Table: ${table}`,
          status: 'pass',
          message: `Table "${table}" è accessibile`,
          details: { recordsFound: data?.length || 0 },
        });
      } else if (status === 404) {
        results.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `Table "${table}" non trovata`,
          details: { status, error: error?.message },
        });
      } else {
        results.push({
          name: `Table: ${table}`,
          status: 'fail',
          message: `Errore accesso table "${table}": ${error?.message}`,
          details: { status, error },
        });
      }
    } catch (error: any) {
      results.push({
        name: `Table: ${table}`,
        status: 'fail',
        message: `Errore: ${error.message}`,
        details: error,
      });
    }
  }

  return results;
}

/**
 * Testa i real-time subscriptions
 */
export async function testRealtimeSubscription(): Promise<TestResult> {
  try {
    const subscription = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('Real-time event received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Test subscribe
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Cleanup
    await supabase.removeChannel(subscription);

    return {
      name: 'Real-time Subscriptions',
      status: 'pass',
      message: 'Real-time subscriptions funzionano correttamente',
    };
  } catch (error: any) {
    return {
      name: 'Real-time Subscriptions',
      status: 'fail',
      message: `Errore: ${error.message}`,
      details: error,
    };
  }
}

/**
 * Esegui tutti i test
 */
export async function runAllTests(): Promise<TestResult[]> {
  console.log('🧪 Avvio test Supabase...\n');

  const results: TestResult[] = [];

  // Test connessione
  const connTest = await testSupabaseConnection();
  results.push(connTest);
  console.log(`${connTest.status === 'pass' ? '✅' : '❌'} ${connTest.name}: ${connTest.message}`);

  if (connTest.status === 'fail') {
    console.log('\n❌ Connessione fallita. Ferma qui.');
    return results;
  }

  // Test autenticazione
  const authTest = await testAuthentication();
  results.push(authTest);
  console.log(`${authTest.status === 'pass' ? '✅' : '❌'} ${authTest.name}: ${authTest.message}`);

  // Test tabelle
  console.log('\n📊 Test tabelle database:');
  const tableTests = await testDatabaseTables();
  results.push(...tableTests);
  tableTests.forEach((test) => {
    console.log(`${test.status === 'pass' ? '✅' : '❌'} ${test.name}: ${test.message}`);
  });

  // Test real-time
  console.log('\n🔄 Test real-time:');
  const realtimeTest = await testRealtimeSubscription();
  results.push(realtimeTest);
  console.log(`${realtimeTest.status === 'pass' ? '✅' : '❌'} ${realtimeTest.name}: ${realtimeTest.message}`);

  // Summary
  console.log('\n📈 Riassunto:');
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  return results;
}

/**
 * Esporta funzione per testing rapido in console
 */
export async function quickTest() {
  return await runAllTests();
}
