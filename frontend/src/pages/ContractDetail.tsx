import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClipboardCheck, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { CLAUSE_TYPE_LABELS, CLAUSE_TYPE_COLORS } from '@/lib/constants';
import type { ContractMetadata, ExtractedClause, ClauseType } from '@/types/api';

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<ContractMetadata | null>(null);
  const [clauses, setClauses] = useState<ExtractedClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getContract(id), api.getContractClauses(id)])
      .then(([c, cls]) => {
        setContract(c);
        setClauses(cls);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading contract...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        {error || 'Contract not found'}
      </div>
    );
  }

  const byType = clauses.reduce<Record<ClauseType, ExtractedClause[]>>(
    (acc, c) => {
      (acc[c.clause_type] ??= []).push(c);
      return acc;
    },
    {} as Record<ClauseType, ExtractedClause[]>
  );
  const types = Object.keys(byType) as ClauseType[];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <FileText className="mt-1 h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">{contract.filename}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Uploaded {new Date(contract.upload_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <Button asChild>
            <Link to={`/contracts/${contract.contract_id}/review`}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              Run Review
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground">Pages</p>
              <p className="font-medium">{contract.num_pages}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Clauses</p>
              <p className="font-medium">{contract.num_clauses}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Text Length</p>
              <p className="font-medium">
                {contract.text_length.toLocaleString()} chars
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Types</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {contract.clause_types_found.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className={CLAUSE_TYPE_COLORS[t]}
                  >
                    {CLAUSE_TYPE_LABELS[t]}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clause tabs */}
      {types.length > 0 ? (
        <Tabs defaultValue={types[0]}>
          <TabsList className="flex-wrap">
            {types.map((t) => (
              <TabsTrigger key={t} value={t}>
                {CLAUSE_TYPE_LABELS[t]} ({byType[t].length})
              </TabsTrigger>
            ))}
          </TabsList>

          {types.map((t) => (
            <TabsContent key={t} value={t} className="space-y-3">
              {byType[t].map((clause) => (
                <ClauseCard key={clause.clause_id} clause={clause} />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No clauses extracted for this contract.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ClauseCard({ clause }: { clause: ExtractedClause }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = clause.text.length > 300;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={CLAUSE_TYPE_COLORS[clause.clause_type]}>
            {CLAUSE_TYPE_LABELS[clause.clause_type]}
          </Badge>
          {clause.section_number && (
            <span className="text-xs text-muted-foreground">
              Section {clause.section_number}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            Page {clause.page_number}
          </span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {isLong && !expanded
            ? clause.text.slice(0, 300) + '...'
            : clause.text}
        </p>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {/* Confidence bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Confidence</span>
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.round(clause.confidence * 100)}%` }}
            />
          </div>
          <span className="text-xs font-medium">
            {Math.round(clause.confidence * 100)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
