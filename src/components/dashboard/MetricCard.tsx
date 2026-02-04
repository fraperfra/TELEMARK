import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MetricCardProps {
  label: string;
  value: string | number;
  target?: number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function MetricCard({ label, value, target, icon: Icon, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const progress = target && typeof value === 'number' ? (value / target) * 100 : undefined;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <h3 className="text-3xl font-bold mt-2">{value}</h3>
            {target && typeof value === 'number' && (
              <div className="mt-3 space-y-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">
                  Obiettivo: {target}
                </p>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
