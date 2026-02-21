import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  List,
  Tags,
  BookOpen,
  Eye,
  ClipboardCheck,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import { CLAUSE_TYPE_LABELS, CLAUSE_TYPE_COLORS } from '@/lib/constants';
import type { ContractMetadata } from '@/types/api';

export function Dashboard() {
  const [contracts, setContracts] = useState<ContractMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .listContracts()
      .then(setContracts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const totalClauses = contracts.reduce((s, c) => s + c.num_clauses, 0);
  const totalPages = contracts.reduce((s, c) => s + c.num_pages, 0);
  const uniqueTypes = new Set(contracts.flatMap((c) => c.clause_types_found));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Loading contracts...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Contracts"
          value={contracts.length}
        />
        <StatCard icon={List} label="Clauses" value={totalClauses} />
        <StatCard icon={Tags} label="Clause Types" value={uniqueTypes.size} />
        <StatCard icon={BookOpen} label="Pages Analyzed" value={totalPages} />
      </div>

      {/* Contracts table or empty state */}
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No contracts uploaded yet.</p>
            <Button asChild>
              <Link to="/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Contract
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-center">Pages</TableHead>
                  <TableHead className="text-center">Clauses</TableHead>
                  <TableHead>Types</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.contract_id}>
                    <TableCell>
                      <Link
                        to={`/contracts/${c.contract_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.filename}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.upload_timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">{c.num_pages}</TableCell>
                    <TableCell className="text-center">
                      {c.num_clauses}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.clause_types_found.map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className={CLAUSE_TYPE_COLORS[t]}
                          >
                            {CLAUSE_TYPE_LABELS[t]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/contracts/${c.contract_id}`}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/contracts/${c.contract_id}/review`}>
                            <ClipboardCheck className="mr-1 h-3 w-3" />
                            Review
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="rounded-lg bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
