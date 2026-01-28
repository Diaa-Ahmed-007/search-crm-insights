import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface AreaTraffic {
  id: string;
  name: string;
  projectName: string;
  leadCount: number;
}

export default function MostTrafficArea() {
  const [topAreas, setTopAreas] = useState<AreaTraffic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopAreas = async () => {
      // Get leads with their unit -> area relationship
      const { data: leads } = await supabase
        .from('leads')
        .select('unit_id, units(area_id, areas(id, name, projects(name)))');

      if (leads) {
        // Count leads per area
        const areaCountMap = new Map<string, AreaTraffic>();
        
        leads.forEach((lead) => {
          if (lead.units?.areas) {
            const areaId = lead.units.areas.id;
            const existing = areaCountMap.get(areaId);
            if (existing) {
              existing.leadCount++;
            } else {
              areaCountMap.set(areaId, {
                id: areaId,
                name: lead.units.areas.name,
                projectName: lead.units.areas.projects?.name || 'Unknown',
                leadCount: 1,
              });
            }
          }
        });

        // Sort by lead count and take top 5
        const sorted = Array.from(areaCountMap.values())
          .sort((a, b) => b.leadCount - a.leadCount)
          .slice(0, 5);
        
        setTopAreas(sorted);
      }
      setIsLoading(false);
    };

    fetchTopAreas();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Most Traffic Areas</CardTitle>
        <TrendingUp className="h-5 w-5 text-green-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : topAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data available</p>
        ) : (
          <div className="space-y-3">
            {topAreas.map((area, index) => (
              <div key={area.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{area.name}</p>
                    <p className="text-xs text-muted-foreground">{area.projectName}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold">{area.leadCount} leads</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
