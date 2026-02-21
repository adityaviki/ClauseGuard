import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import {
  ALL_CLAUSE_TYPES,
  CLAUSE_TYPE_LABELS,
  CLAUSE_TYPE_COLORS,
} from '@/lib/constants';
import type { ClauseType, SearchHit } from '@/types/api';
import { cn } from '@/lib/utils';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ClauseType[]>([]);
  const [topK, setTopK] = useState(10);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.search({
        query: query.trim(),
        clause_types: selectedTypes.length > 0 ? selectedTypes : null,
        top_k: topK,
      });
      setHits(res.hits);
      setTotalHits(res.total_hits);
      setSearched(true);
    } catch {
      setHits([]);
      setTotalHits(0);
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (t: ClauseType) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search Clauses</h1>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for clauses (e.g. indemnity, liability)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doSearch()}
          className="flex-1"
        />
        <Button onClick={doSearch} disabled={loading || !query.trim()}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Search
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        {ALL_CLAUSE_TYPES.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className={cn(
              'cursor-pointer transition-opacity',
              CLAUSE_TYPE_COLORS[t],
              selectedTypes.length > 0 &&
                !selectedTypes.includes(t) &&
                'opacity-40'
            )}
            onClick={() => toggleType(t)}
          >
            {CLAUSE_TYPE_LABELS[t]}
          </Badge>
        ))}

        <Select
          value={String(topK)}
          onValueChange={(v) => setTopK(Number(v))}
        >
          <SelectTrigger className="ml-auto w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[5, 10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                Top {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {searched && !loading && (
        <p className="text-sm text-muted-foreground">
          {totalHits} result{totalHits !== 1 ? 's' : ''} found
        </p>
      )}

      <div className="space-y-3">
        {hits.map((hit) => (
          <Card key={hit.clause_id}>
            <CardContent className="space-y-2 pt-6">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={CLAUSE_TYPE_COLORS[hit.clause_type]}
                >
                  {CLAUSE_TYPE_LABELS[hit.clause_type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Score: {hit.score.toFixed(3)}
                </span>
                <Link
                  to={`/contracts/${hit.contract_id}`}
                  className="ml-auto text-xs text-primary hover:underline"
                >
                  View Contract
                </Link>
              </div>
              {(hit.section_number || hit.page_number) && (
                <p className="text-xs text-muted-foreground">
                  {hit.section_number && `Section ${hit.section_number} · `}
                  Page {hit.page_number}
                </p>
              )}
              {hit.highlights.length > 0 ? (
                <div className="space-y-1">
                  {hit.highlights.map((h, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: h }}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {hit.text.length > 400
                    ? hit.text.slice(0, 400) + '...'
                    : hit.text}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {searched && !loading && hits.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No results found for "{query}".
          </CardContent>
        </Card>
      )}
    </div>
  );
}
