import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';

interface Step {
  label: string;
  done?: boolean;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  steps?: Step[];
}

export default function EmptyState({ icon, title, description, actionLabel, onAction, steps }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-14 flex flex-col items-center text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}

        {steps && steps.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            {steps.map((s, i) => (
              <React.Fragment key={s.label}>
                <span className={`px-2.5 py-1 rounded-full border ${s.done ? 'bg-primary/10 text-primary border-primary/30 font-medium' : 'border-border'}`}>
                  {s.done ? '✓ ' : ''}{s.label}
                </span>
                {i < steps.length - 1 && <ArrowRight className="h-3 w-3" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
