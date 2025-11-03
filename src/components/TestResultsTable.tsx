import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown } from 'lucide-react';

interface TestResult {
  id: string;
  created_at: string;
  medical_tests: {
    test_name: string;
    test_type: string;
    consultations: {
      patients: {
        full_name: string;
        email: string;
      };
    };
  };
}

interface TestResultsTableProps {
  testResults: TestResult[];
}

export default function TestResultsTable({ testResults }: TestResultsTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'patient' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: 'date' | 'patient' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = testResults
    .filter((result) => {
      const searchLower = searchTerm.toLowerCase();
      const patientName = result.medical_tests?.consultations?.patients?.full_name?.toLowerCase() || '';
      const testType = result.medical_tests?.test_type?.toLowerCase() || '';
      const testName = result.medical_tests?.test_name?.toLowerCase() || '';
      
      return (
        patientName.includes(searchLower) ||
        testType.includes(searchLower) ||
        testName.includes(searchLower)
      );
    })
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (sortField === 'date') {
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      } else if (sortField === 'patient') {
        const nameA = a.medical_tests?.consultations?.patients?.full_name || '';
        const nameB = b.medical_tests?.consultations?.patients?.full_name || '';
        return multiplier * nameA.localeCompare(nameB);
      } else if (sortField === 'type') {
        const typeA = a.medical_tests?.test_type || '';
        const typeB = b.medical_tests?.test_type || '';
        return multiplier * typeA.localeCompare(typeB);
      }
      
      return 0;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Medical Test Results</span>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient or test type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredAndSorted.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No matching test results found' : 'No test results available'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('patient')}
                    className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                  >
                    Patient Name
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('type')}
                    className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                  >
                    Type of Test
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1 p-0 h-auto font-semibold hover:bg-transparent"
                  >
                    Date Conducted
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((result) => (
                <TableRow key={result.id} className="cursor-pointer hover:bg-accent/50">
                  <TableCell
                    onClick={() => navigate(`/test-result/${result.id}`)}
                    className="font-medium text-primary hover:underline"
                  >
                    {result.medical_tests?.consultations?.patients?.full_name || 'Unknown Patient'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {result.medical_tests?.test_type || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(result.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/test-result/${result.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
