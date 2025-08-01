import React from 'react';
import { Button } from './button';
import { Switch } from './switch';
import { Label } from './label';
import { Bot, Monitor } from 'lucide-react';

interface BrowserFilterProps {
  excludeBrowsers: boolean;
  onToggle: (excludeBrowsers: boolean) => void;
  className?: string;
}

export const BrowserFilter: React.FC<BrowserFilterProps> = ({
  excludeBrowsers,
  onToggle,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Switch
          id="browser-filter"
          checked={excludeBrowsers}
          onCheckedChange={onToggle}
        />
        <Label htmlFor="browser-filter" className="text-sm font-medium">
          {excludeBrowsers ? 'Bot Traffic Only' : 'Show All Traffic'}
        </Label>
      </div>
      
      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
        {excludeBrowsers ? (
          <>
            <Bot className="h-3 w-3" />
            <span>Filtering out common browsers</span>
          </>
        ) : (
          <>
            <Monitor className="h-3 w-3" />
            <span>Showing all traffic</span>
          </>
        )}
      </div>
    </div>
  );
}; 