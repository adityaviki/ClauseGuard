import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ALL_CLAUSE_TYPES, CLAUSE_TYPE_LABELS } from '@/lib/constants';
import type { ClauseType } from '@/types/api';
import { cn } from '@/lib/utils';

interface CoverageMapProps {
  coverage: Record<string, boolean>;
  missingRequired: ClauseType[];
}

export function CoverageMap({ coverage, missingRequired }: CoverageMapProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {ALL_CLAUSE_TYPES.filter((t) => t !== 'other').map((t) => {
        const found = coverage[t] ?? false;
        const isMissing = missingRequired.includes(t);

        return (
          <Card
            key={t}
            className={cn(
              'transition-colors',
              found
                ? 'border-green-200 dark:border-green-900'
                : isMissing
                  ? 'border-red-300 dark:border-red-800'
                  : 'border-muted'
            )}
          >
            <CardContent className="flex items-center gap-3 p-4">
              {found ? (
                <Check className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <X className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{CLAUSE_TYPE_LABELS[t]}</p>
                {isMissing && (
                  <Badge
                    variant="destructive"
                    className="mt-1 text-[10px]"
                  >
                    Required - Missing
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
