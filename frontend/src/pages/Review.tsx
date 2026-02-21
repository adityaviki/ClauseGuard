import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { SEVERITY_CARD_COLORS } from '@/lib/constants';
import { RiskGauge } from '@/components/RiskGauge';
import { CoverageMap } from '@/components/CoverageMap';
import { FindingCard } from '@/components/FindingCard';
import type { RiskReport, Severity } from '@/types/api';

export function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .reviewContract(id)
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Running compliance review... This may take a moment.</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <p>{error || 'Failed to load report'}</p>
        <Button variant="outline" asChild>
          <Link to={id ? `/contracts/${id}` : '/'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>
    );
  }

  const severityTabs: { key: Severity; label: string; count: number }[] = [
    { key: 'high', label: 'High', count: report.num_high },
    { key: 'medium', label: 'Medium', count: report.num_medium },
    { key: 'low', label: 'Low', count: report.num_low },
  ];

  const findingsBySeverity = (severity: Severity) =>
    report.findings.filter((f) => f.severity === severity);

  return (
    <div className="space-y-6">
      {/* Back link + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={id ? `/contracts/${id}` : '/'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Compliance Review</h1>
          {report.contract_filename && (
            <p className="text-sm text-muted-foreground">
              {report.contract_filename}
            </p>
          )}
        </div>
      </div>

      {/* Risk gauge + Summary */}
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <RiskGauge score={report.overall_risk_score} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {report.summary || 'No summary available.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity count cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {severityTabs.map(({ key, label, count }) => (
          <Card
            key={key}
            className={`border-l-4 ${SEVERITY_CARD_COLORS[key]}`}
          >
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{label} Severity</span>
              <span className="text-2xl font-bold">{count}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Coverage map */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Clause Coverage</h2>
        <CoverageMap
          coverage={report.coverage}
          missingRequired={report.missing_required_clauses}
        />
      </div>

      <Separator />

      {/* Findings tabs */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Findings</h2>
        {report.findings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No findings reported.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={severityTabs.find((s) => s.count > 0)?.key ?? 'high'}>
            <TabsList>
              {severityTabs.map(({ key, label, count }) => (
                <TabsTrigger key={key} value={key} disabled={count === 0}>
                  {label} ({count})
                </TabsTrigger>
              ))}
            </TabsList>
            {severityTabs.map(({ key }) => (
              <TabsContent key={key} value={key} className="space-y-3">
                {findingsBySeverity(key).map((f, i) => (
                  <FindingCard key={i} finding={f} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
