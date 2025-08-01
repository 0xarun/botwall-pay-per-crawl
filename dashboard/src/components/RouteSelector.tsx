import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { X, Plus } from 'lucide-react';

interface RouteSelectorProps {
  routes: string[];
  onChange: (routes: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  routes,
  onChange,
  label = 'Monetized Routes',
  placeholder = 'e.g., /api/*, /docs/*'
}) => {
  const [newRoute, setNewRoute] = useState('');

  const addRoute = () => {
    if (newRoute.trim() && !routes.includes(newRoute.trim())) {
      onChange([...routes, newRoute.trim()]);
      setNewRoute('');
    }
  };

  const removeRoute = (routeToRemove: string) => {
    onChange(routes.filter(route => route !== routeToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRoute();
    }
  };

  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      
      <div className="flex gap-2">
        <Input
          value={newRoute}
          onChange={(e) => setNewRoute(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRoute}
          disabled={!newRoute.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {routes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {routes.map((route, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {route}
              <button
                type="button"
                onClick={() => removeRoute(route)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Use glob patterns like <code className="bg-muted px-1 rounded">/*</code>, <code className="bg-muted px-1 rounded">/api/*</code>, or <code className="bg-muted px-1 rounded">/docs/*</code>
      </p>
    </div>
  );
}; 