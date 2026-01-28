import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Home, MapPin, Users } from 'lucide-react';
import MostTrafficArea from '@/components/dashboard/MostTrafficArea';
import LatestUnits from '@/components/dashboard/LatestUnits';
import LatestLeads from '@/components/dashboard/LatestLeads';

export default function Dashboard() {
  const { role } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    areas: 0,
    units: 0,
    leads: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [projectsRes, areasRes, unitsRes, leadsRes] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('areas').select('id', { count: 'exact', head: true }),
        supabase.from('units').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        projects: projectsRes.count || 0,
        areas: areasRes.count || 0,
        units: unitsRes.count || 0,
        leads: leadsRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Projects', value: stats.projects, icon: Building2, color: 'text-blue-500' },
    { title: 'Areas', value: stats.areas, icon: MapPin, color: 'text-green-500' },
    { title: 'Units', value: stats.units, icon: Home, color: 'text-purple-500' },
    { title: 'Leads', value: stats.leads, icon: Users, color: 'text-orange-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! You are logged in as {role}.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MostTrafficArea />
          <LatestUnits />
          <LatestLeads />
        </div>
      </div>
    </DashboardLayout>
  );
}
