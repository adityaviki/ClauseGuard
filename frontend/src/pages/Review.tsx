import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  AlertCircle,
  Info,
  ShieldAlert,
  ShieldCheck,
  ShieldMinus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
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
      <div className="flex h-80 flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <div className="text-center">
          <p className="font-semibold">Running Compliance Review</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyzing clauses against templates... This may take a moment.
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{error || 'Failed to load report'}</p>
        <Button variant="outline" asChild>
          <Link to={id ? `/contracts/${id}` : '/'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Link>
        </Button>
      </div>
    );
  }

  const severityTabs: { key: Severity; label: string; count: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'high', label: 'High', count: report.num_high, icon: AlertCircle },
    { key: 'medium', label: 'Medium', count: report.num_medium, icon: AlertTriangle },
    { key: 'low', label: 'Low', count: report.num_low, icon: Info },
  ];

  const findingsBySeverity = (severity: Severity) =>
    report.findings.filter((f) => f.severity === severity);

  return (
    <div className="space-y-8">
      {/* Back link + title */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={id ? `/contracts/${id}` : '/'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance Review</h1>
          {report.contract_filename && (
            <p className="text-sm text-muted-foreground">{report.contract_filename}</p>
          )}
        </div>
      </div>

      {/* Risk gauge + Executive Summary */}
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="flex items-center justify-center">
          <CardContent className="p-8">
            <RiskGauge score={report.overall_risk_score} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Executive Summary
            </h2>
            <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
              {report.summary || 'No summary available.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Severity count cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SeverityCard
          label="High Severity"
          count={report.num_high}
          icon={ShieldAlert}
          colorClass="border-l-red-500 bg-red-50/50"
          iconColor="text-red-500"
          countColor="text-red-600"
        />
        <SeverityCard
          label="Medium Severity"
          count={report.num_medium}
          icon={ShieldMinus}
          colorClass="border-l-amber-500 bg-amber-50/50"
          iconColor="text-amber-500"
          countColor="text-amber-600"
        />
        <SeverityCard
          label="Low Severity"
          count={report.num_low}
          icon={ShieldCheck}
          colorClass="border-l-blue-500 bg-blue-50/50"
          iconColor="text-blue-500"
          countColor="text-blue-600"
        />
      </div>

      {/* Coverage map */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Clause Coverage</h2>
        <CoverageMap
          coverage={report.coverage}
          missingRequired={report.missing_required_clauses}
        />
      </div>

      {/* Findings */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Findings</h2>
        {report.findings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No findings reported. This contract appears compliant.
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={severityTabs.find((s) => s.count > 0)?.key ?? 'high'}>
            <TabsList className="mb-4 h-auto gap-1 bg-transparent p-0">
              {severityTabs.map(({ key, label, count, icon: Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  disabled={count === 0}
                  className="gap-2 rounded-full border border-border bg-card data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary disabled:opacity-40"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  <span className="rounded-full bg-black/5 px-1.5 text-[11px] font-bold data-[state=active]:bg-white/20">
                    {count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            {severityTabs.map(({ key }) => (
              <TabsContent key={key} value={key} className="space-y-4">
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

function SeverityCard({
  label,
  count,
  icon: Icon,
  colorClass,
  iconColor,
  countColor,
}: {
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconColor: string;
  countColor: string;
}) {
  return (
    <Card className={`border-l-4 ${colorClass}`}>
      <CardContent className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-3xl font-bold ${countColor}`}>{count}</span>
      </CardContent>
    </Card>
  );
}
