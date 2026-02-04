import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import twilio from 'twilio';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import config, { logConfig, printValidation } from './config';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';

// Types
interface AuthRequest extends Request {
  userId?: string;
  orgId?: string;
}

// Initialize Express
const app = express();
const port = config.port;

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

// Initialize services
const twilioClient = config.twilio.accountSid && config.twilio.accountSid.startsWith('AC') 
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

const openai = config.openai.apiKey 
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

const supabase = createClient(
  config.supabase.url!,
  config.supabase.serviceKey!
);

// ============================================
// ROUTES
// ============================================

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// ============================================
// HEALTH CHECK ENDPOINTS
// ============================================

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    features: config.features,
  });
});

app.get('/api/health/detailed', async (req: Request, res: Response) => {
  const health = {
    server: { status: 'ok' },
    supabase: { status: 'checking' },
    openai: { status: config.features.aiAnalysis ? 'configured' : 'disabled' },
    twilio: { status: config.features.smsNotifications ? 'configured' : 'disabled' },
    stripe: { status: config.features.payments ? 'configured' : 'disabled' },
  };

  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('owners').select('count', { count: 'exact', head: true });
    health.supabase.status = error ? 'error' : 'ok';
  } catch (error) {
    health.supabase.status = 'error';
  }

  res.json(health);
});

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

// Email notifications
app.post('/api/notifications/email', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.features.emailNotifications) {
      return res.status(503).json({ error: 'Email notifications not configured' });
    }

    const { to, template, data, subject } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: 'to and subject required' });
    }

    // TODO: Implement with Resend
    // const response = await resend.emails.send({
    //   from: 'noreply@immocrm.dev',
    //   to,
    //   subject,
    //   html: renderTemplate(template, data),
    // });

    console.log('📧 Email:', { to, subject, template });

    res.json({
      success: true,
      message: 'Email queued for sending',
    });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// SMS notifications (Twilio)
app.post('/api/notifications/sms', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.features.smsNotifications || !twilioClient) {
      return res.status(503).json({ error: 'SMS notifications not configured' });
    }

    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ error: 'to and message required' });
    }

    const result = await twilioClient.messages.create({
      from: config.twilio.phoneNumber,
      to,
      body: message,
    });

    console.log('💬 SMS sent:', { to, sid: result.sid });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      sid: result.sid,
    });
  } catch (error) {
    console.error('SMS error:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// Push notifications
app.post('/api/notifications/push', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.features.pushNotifications) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    const { subscription, title, body, icon, badge, tag } = req.body;

    if (!subscription || !title || !body) {
      return res.status(400).json({ error: 'subscription, title, and body required' });
    }

    // TODO: Implement with web-push library
    // const webpush = require('web-push');
    // webpush.setVapidDetails(
    //   'mailto:support@immocrm.dev',
    //   config.webPush.publicKey,
    //   config.webPush.privateKey
    // );
    // await webpush.sendNotification(subscription, JSON.stringify({
    //   title, body, icon, badge, tag
    // }));

    console.log('🔔 Push notification:', { title, body });

    res.json({
      success: true,
      message: 'Push notification sent',
    });
  } catch (error) {
    console.error('Push notification error:', error);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

// ============================================
// ALERTS & REMINDERS
// ============================================

// Create alert
app.post('/api/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, organization_id, type, title, message, action_url, severity } = req.body;

    if (!user_id && !organization_id) {
      return res.status(400).json({ error: 'user_id or organization_id required' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user_id || null,
        organization_id: organization_id || null,
        type: type || 'alert',
        title,
        message,
        action_url,
        severity: severity || 'medium',
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('🔔 Alert created:', { id: data?.id });

    res.json({
      success: true,
      message: 'Alert created',
      data,
    });
  } catch (error) {
    console.error('Alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Create reminder
app.post('/api/reminders', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, title, description, scheduled_for, type, contact_id, call_id } = req.body;

    if (!user_id || !title || !scheduled_for) {
      return res.status(400).json({ error: 'user_id, title, and scheduled_for required' });
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id,
        title,
        description: description || null,
        scheduled_for,
        type: type || 'call',
        contact_id: contact_id || null,
        call_id: call_id || null,
        is_completed: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log('⏰ Reminder created:', { id: data?.id, scheduled_for });

    res.json({
      success: true,
      message: 'Reminder created',
      data,
    });
  } catch (error) {
    console.error('Reminder error:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// ============================================
// AI ANALYSIS ENDPOINTS
// ============================================

// Analyze call transcript
app.post('/api/ai/analyze-call', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.features.aiAnalysis || !openai) {
      return res.status(503).json({ error: 'AI features not configured' });
    }

    const { transcript, language = 'it' } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'transcript required' });
    }

    const systemPrompt = 
      language === 'it'
        ? 'Sei un esperto analista di conversazioni immobiliari. Analizza la chiamata e fornisci un JSON con: score (0-100), priority (hot/warm/cold), key_signals (array), red_flags (array), summary (max 100 parole).'
        : 'You are an expert real estate call analyst. Analyze the call and provide JSON with: score (0-100), priority (hot/warm/cold), key_signals (array), red_flags (array), summary (max 100 words).';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Analizza questa conversazione:\n\n${transcript}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');

    console.log('🤖 Call analysis:', { score: analysis.score, priority: analysis.priority });

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze call' });
  }
});

// Lead scoring
app.post('/api/ai/score-lead', async (req: AuthRequest, res: Response) => {
  try {
    if (!config.features.aiAnalysis || !openai) {
      return res.status(503).json({ error: 'AI features not configured' });
    }

    const { contact_name, contact_info, interaction_history } = req.body;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a real estate lead scoring expert. Provide a JSON with: score (0-100), temperature (hot/warm/cold), recommendation, risk_factors.',
        },
        {
          role: 'user',
          content: `Score this lead: ${JSON.stringify({ contact_name, contact_info, interaction_history })}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const score = JSON.parse(response.choices[0].message.content || '{}');

    res.json({
      success: true,
      score,
    });
  } catch (error) {
    console.error('Lead scoring error:', error);
    res.status(500).json({ error: 'Failed to score lead' });
  }
});

// ============================================
// SUPABASE DATABASE OPERATIONS
// ============================================

// Get owners list
app.get('/api/owners', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Owners error:', error);
    res.status(500).json({ error: 'Failed to fetch owners' });
  }
});

// Get contacts
app.get('/api/contacts', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get appointments
app.get('/api/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ============================================
// SERVER STARTUP
// ============================================

// Validate config on startup
printValidation();
logConfig();

// Start server
app.listen(port, () => {
  console.log('\n✅ API server started successfully!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 Server running on: http://localhost:${port}`);
  console.log(`📍 API endpoints available at: ${config.apiUrl}`);
  console.log(`🎯 CORS enabled for: ${config.cors.origin}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📚 Available endpoints:');
  console.log('  POST /api/auth/register         - Register new user');
  console.log('  POST /api/auth/login            - Login user');
  console.log('  POST /api/auth/refresh          - Refresh token');
  console.log('  POST /api/auth/logout           - Logout user');
  console.log('  GET  /api/auth/me               - Get current user');
  console.log('  GET  /api/health                - Server health check');
  console.log('  GET  /api/health/detailed       - Detailed service status');
  console.log('  POST /api/notifications/email  - Send email');
  console.log('  POST /api/notifications/sms    - Send SMS');
  console.log('  POST /api/notifications/push   - Send push notification');
  console.log('  POST /api/alerts               - Create alert');
  console.log('  POST /api/reminders            - Create reminder');
  console.log('  POST /api/ai/analyze-call      - AI call analysis');
  console.log('  POST /api/ai/score-lead        - AI lead scoring');
  console.log('  GET  /api/owners               - List owners');
  console.log('  GET  /api/contacts             - List contacts');
  console.log('  GET  /api/appointments         - List appointments');
  console.log('');
});

export default app;
