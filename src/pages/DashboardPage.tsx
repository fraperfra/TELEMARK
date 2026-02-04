// src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, Folder, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { UpcomingAppointments } from '@/components/calendar/UpcomingAppointments';
import { HotLeadsList } from '@/components/dashboard/HotLeadsList';
import { WeeklyPerformanceChart } from '@/components/dashboard/WeeklyPerformanceChart';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DashboardStats {
  callsToday: number;
  qualifiedToday: number;
  appointmentsBooked: number;
  avgCallDuration: number;
  dailyTarget: number;
  pendingContacts: number;
  activeCampaigns: number;
  weeklyData: any[];
  hotLeads: any[];
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadDashboardStats();
    }
  }, [profile]);

  async function loadDashboardStats() {
    if (!profile) return;

    setLoading(true);
    try {
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      // Chiamate oggi
      const { count: callsToday } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .gte('started_at', todayStart.toISOString())
        .lte('started_at', todayEnd.toISOString());

      // Qualificati oggi
      const { count: qualifiedToday } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .eq('outcome', 'qualified')
        .gte('started_at', todayStart.toISOString())
        .lte('started_at', todayEnd.toISOString());

      // Appuntamenti prenotati oggi
      const { count: appointmentsBooked } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      // Durata media chiamate
      const { data: callDurations } = await supabase
        .from('calls')
        .select('duration_seconds')
        .eq('agent_id', profile.id)
        .gte('started_at', todayStart.toISOString())
        .not('duration_seconds', 'is', null);

      const avgCallDuration =
        callDurations && callDurations.length > 0
          ? callDurations.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) /
            callDurations.length
          : 0;

      // Contatti pending
      const { count: pendingContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', profile.id)
        .eq('call_status', 'pending');

      // Campagne attive
      const { count: activeCampaigns } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active');

      // Hot leads (ultimi 7 giorni, score > 70)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: hotLeads } = await supabase
        .from('contacts')
        .select(`
          *,
          campaigns(name)
        `)
        .eq('assigned_to', profile.id)
        .eq('last_priority', 'hot')
        .gte('last_called_at', sevenDaysAgo.toISOString())
        .order('last_score', { ascending: false })
        .limit(5);

      // Weekly data (ultimi 7 giorni)
      const { data: weeklyStats } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('agent_id', profile.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      setStats({
        callsToday: callsToday || 0,
        qualifiedToday: qualifiedToday || 0,
        appointmentsBooked: appointmentsBooked || 0,
        avgCallDuration: Math.round(avgCallDuration),
        dailyTarget: 30, // TODO: Get from settings
        pendingContacts: pendingContacts || 0,
        activeCampaigns: activeCampaigns || 0,
        weeklyData: weeklyStats || [],
        hotLeads: hotLeads || [],
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">Ciao {profile?.name} 👋</h1>
        <p className="text-gray-600 mt-1">
          Oggi è {format(new Date(), "EEEE d MMMM", { locale: it })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          className="h-20 justify-start"
          onClick={() => navigate('/dialer')}
        >
          <Phone className="w-6 h-6 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Inizia Chiamate</div>
            <div className="text-xs opacity-80">
              {stats.pendingContacts} contatti da chiamare
            </div>
          </div>
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-20 justify-start"
          onClick={() => navigate('/calendar')}
        >
          <Calendar className="w-6 h-6 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Calendario</div>
            <div className="text-xs opacity-80">
              Gestisci appuntamenti
            </div>
          </div>
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-20 justify-start"
          onClick={() => navigate('/campaigns')}
        >
          <Folder className="w-6 h-6 mr-3" />
          <div className="text-left">
            <div className="font-semibold">Campagne</div>
            <div className="text-xs opacity-80">
              {stats.activeCampaigns} attive
            </div>
          </div>
        </Button>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Chiamate Oggi"
          value={stats.callsToday}
          target={stats.dailyTarget}
          icon={Phone}
        />
        <MetricCard
          label="Qualificati"
          value={stats.qualifiedToday}
          icon={CheckCircle}
        />
        <MetricCard
          label="Appuntamenti"
          value={stats.appointmentsBooked}
          icon={Calendar}
        />
        <MetricCard
          label="Durata Media"
          value={`${Math.round(stats.avgCallDuration / 60)}min`}
          icon={Clock}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Upcoming Appointments */}
          <UpcomingAppointments limit={3} />

          {/* Hot Leads */}
          {stats.hotLeads.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔥 Lead Caldi da Ricontattare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HotLeadsList leads={stats.hotLeads} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Week Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Settimana</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklyPerformanceChart data={stats.weeklyData} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiche Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tasso Risposta</span>
                  <span className="font-semibold">
                    {stats.callsToday > 0
                      ? Math.round((stats.qualifiedToday / stats.callsToday) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Contatti Pending</span>
                  <span className="font-semibold">{stats.pendingContacts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Campagne Attive</span>
                  <span className="font-semibold">{stats.activeCampaigns}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
