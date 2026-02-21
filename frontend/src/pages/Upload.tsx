import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, Eye, ClipboardCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropZone } from '@/components/DropZone';
import { api } from '@/lib/api';
import { CLAUSE_TYPE_LABELS, CLAUSE_TYPE_COLORS } from '@/lib/constants';
import type { ContractUploadResponse } from '@/types/api';

export function UploadPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<ContractUploadResponse | null>(null);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setStatus('loading');
    setError('');
    try {
      const res = await api.uploadContract(file);
      setResult(res);
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Upload Contract</h1>

      <Card>
        <CardHeader>
          <CardTitle>Select a file</CardTitle>
        </CardHeader>
        <CardContent>
          <DropZone onFile={handleFile} disabled={status === 'loading'} />
        </CardContent>
      </Card>

      {status === 'loading' && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Uploading and analyzing contract...</span>
          </CardContent>
        </Card>
      )}

      {status === 'error' && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-3 pt-6 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {status === 'success' && result && (
        <Card className="border-green-500">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{result.message}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Filename</p>
                <p className="font-medium">{result.filename}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Clauses Found</p>
                <p className="font-medium">{result.num_clauses}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-muted-foreground">Clause Types</p>
              <div className="flex flex-wrap gap-1">
                {result.clause_types_found.map((t) => (
                  <Badge key={t} variant="secondary" className={CLAUSE_TYPE_COLORS[t]}>
                    {CLAUSE_TYPE_LABELS[t]}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button asChild>
                <Link to={`/contracts/${result.contract_id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Contract
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/contracts/${result.contract_id}/review`}>
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Run Review
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
