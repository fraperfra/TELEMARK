import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface HotLead {
  id: string;
  name: string;
  phone: string;
  address: string;
  last_score: number;
  last_called_at: string;
  property_type: string;
  campaigns: { name: string };
}

export function HotLeadsList({ leads }: { leads: HotLead[] }) {
  const navigate = useNavigate();

  function handleCall(lead: HotLead) {
    // TODO: Navigate to dialer with this contact
    navigate(`/dialer?contact=${lead.id}`);
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
        >
          <Avatar>
            <AvatarFallback className="bg-orange-100 text-orange-700">
              {lead.name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{lead.name}</p>
              <Badge variant="default" className="bg-orange-500">
                {lead.last_score}/100
              </Badge>
            </div>
            <p className="text-sm text-gray-600 truncate">
              {lead.property_type} • {lead.campaigns.name}
            </p>
            {lead.address && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {lead.address}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ultima chiamata:{' '}
              {formatDistanceToNow(new Date(lead.last_called_at), {
                addSuffix: true,
                locale: it,
              })}
            </p>
          </div>

          <Button size="sm" onClick={() => handleCall(lead)}>
            <Phone className="w-4 h-4 mr-2" />
            Chiama
          </Button>
        </div>
      ))}
    </div>
  );
}
