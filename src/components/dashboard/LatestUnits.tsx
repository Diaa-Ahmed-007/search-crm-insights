import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Unit {
  id: string;
  unit_number: string;
  type: string | null;
  status: string | null;
  price: number | null;
  areas: { name: string; projects: { name: string } | null } | null;
  created_at: string;
}

export default function LatestUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestUnits = async () => {
      const { data } = await supabase
        .from('units')
        .select('id, unit_number, type, status, price, created_at, areas(name, projects(name))')
        .order('created_at', { ascending: false })
        .limit(5);

      setUnits(data || []);
      setIsLoading(false);
    };

    fetchLatestUnits();
  }, []);

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-red-100 text-red-800',
  };

  const formatPrice = (price: number | null) => {
    if (!price) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Latest Units</CardTitle>
        <Home className="h-5 w-5 text-purple-500" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-muted-foreground">No units found</p>
        ) : (
          <div className="space-y-3">
            {units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{unit.unit_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {unit.areas?.projects?.name} - {unit.areas?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{formatPrice(unit.price)}</span>
                  <Badge variant="secondary" className={statusColors[unit.status || 'available']}>
                    {unit.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
