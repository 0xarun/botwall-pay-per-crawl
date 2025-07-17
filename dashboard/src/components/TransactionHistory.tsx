import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Coins, TrendingUp, AlertCircle } from 'lucide-react';
import { useTransactions } from '@/hooks/usePayments';
import { useBots } from '@/hooks/useBots';
import { formatDistanceToNow } from 'date-fns';

export function TransactionHistory() {
  const { transactions, isLoading, error } = useTransactions();
  const { bots } = useBots();

  const getBotName = (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    return bot?.bot_name || 'Unknown Bot';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.bot_id) {
      return <Coins className="h-4 w-4" />;
    }
    return <CreditCard className="h-4 w-4" />;
  };

  const getTransactionType = (transaction: any) => {
    if (transaction.bot_id) {
      return 'Credit Purchase';
    }
    return 'Payment';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View your payment and credit purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading transactions...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            View your payment and credit purchase history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Failed to load transactions
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>
          View your payment and credit purchase history
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!Array.isArray(transactions) || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2" />
            <p>No transactions yet</p>
            <p className="text-sm">Your payment history will appear here</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTransactionIcon(transaction)}
                      <span className="text-sm font-medium">
                        {getTransactionType(transaction)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {transaction.bot_id ? (
                        <span>Credits for {getBotName(transaction.bot_id)}</span>
                      ) : (
                        <span>Payment</span>
                      )}
                    </div>
                    {transaction.lemon_order_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {transaction.lemon_order_id}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {typeof transaction.amount === 'number' ? `$${transaction.amount.toFixed(2)}` : '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.credits > 0 ? (
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        <span className="font-medium">{transaction.credits}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
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