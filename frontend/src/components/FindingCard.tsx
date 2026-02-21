import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CLAUSE_TYPE_LABELS, CLAUSE_TYPE_COLORS, SEVERITY_COLORS } from '@/lib/constants';
import type { Finding } from '@/types/api';

export function FindingCard({ finding }: { finding: Finding }) {
  const [showTemplate, setShowTemplate] = useState(false);

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {/* Badges */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={SEVERITY_COLORS[finding.severity]}>
            {finding.severity.toUpperCase()}
          </Badge>
          <Badge variant="secondary" className={CLAUSE_TYPE_COLORS[finding.clause_type]}>
            {CLAUSE_TYPE_LABELS[finding.clause_type]}
          </Badge>
        </div>

        {/* Deviation */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Deviation
          </p>
          <p className="mt-1 text-sm">{finding.deviation}</p>
        </div>

        {/* Risk */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Risk
          </p>
          <p className="mt-1 text-sm">{finding.risk}</p>
        </div>

        {/* Clause text (blockquote style) */}
        <blockquote className="border-l-4 border-muted-foreground/30 pl-4 text-sm italic text-muted-foreground">
          {finding.clause_text}
        </blockquote>

        {/* Template text (accordion) */}
        {finding.template_text && (
          <div>
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {showTemplate ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Template Reference
            </button>
            {showTemplate && (
              <p className="mt-2 rounded bg-muted p-3 text-sm">
                {finding.template_text}
              </p>
            )}
          </div>
        )}

        {/* Recommendation */}
        <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
          <p className="text-xs font-medium uppercase tracking-wide text-green-800 dark:text-green-400">
            Recommendation
          </p>
          <p className="mt-1 text-sm text-green-900 dark:text-green-300">
            {finding.recommendation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
