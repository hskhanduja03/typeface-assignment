"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePagination } from "@/utils/pagination";
import EditTransactionModal from "../ui/EditTransactionModal";
import { toast } from "sonner";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "income" | "expense";
  date: string;
  category: {
    name: string;
    color: string;
  };
}

interface Filters {
  search: string;
  type: string;
  categoryId: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  categories: Array<{ id: string; name: string; color: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onFilterChange: (filters: Filters) => void;
  onClearFilters?: () => void;
  loading?: boolean;
  currentFilters: Filters;
  setTransactions: (transactions: any) => void;
}

export function TransactionList({
  transactions,
  categories,
  pagination,
  onPageChange,
  onFilterChange,
  onClearFilters,
  loading,
  currentFilters,
  setTransactions,
}: TransactionListProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(currentFilters);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const {
    getVisiblePages,
    canGoToFirstPage,
    canGoToPreviousPage,
    canGoToNextPage,
    canGoToLastPage,
  } = usePagination({
    currentPage: pagination.page,
    totalPages: pagination.pages,
    visiblePagesCount: 5,
  });

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  const handleModalSave = async (updated: Transaction) => {
    try {
      const res = await fetch(`/api/transactions/${updated.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Update failed");

      const updatedTx = await res.json();

      // Optimistically update local state (if using)
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
      );

      toast.success("Transaction updated successfully");
      setModalOpen(false);
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update transaction");
    }
  };

  // Update local filters when currentFilters prop changes
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleSearchChange = (value: string) => {
    setLocalFilters((prev) => ({ ...prev, search: value }));
  };

  // Immediate filter change handler for non-search filters
  const handleFilterChange = (key: keyof Filters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages) {
      onPageChange(page);
    }
  };

  // Check if any filters are applied
  const hasActiveFilters =
    localFilters.search ||
    localFilters.type ||
    localFilters.categoryId ||
    localFilters.startDate ||
    localFilters.endDate;

  // Clear search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);
  console.log("transactions", transactions);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Recent Transactions</span>
          <div className="flex items-center gap-2">
            {hasActiveFilters && onClearFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear filters
              </Button>
            )}
            <Badge variant="secondary">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} /{" "}
              {pagination.total}
            </Badge>
          </div>
        </CardTitle>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={localFilters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          <Select
            value={localFilters.type || "all"}
            onValueChange={(value) =>
              handleFilterChange("type", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={localFilters.categoryId || "all"}
            onValueChange={(value) =>
              handleFilterChange("categoryId", value === "all" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.startDate
                  ? format(localFilters.startDate, "MMM d")
                  : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.startDate}
                onSelect={(date) => handleFilterChange("startDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.endDate
                  ? format(localFilters.endDate, "MMM d")
                  : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={localFilters.endDate}
                onSelect={(date) => handleFilterChange("endDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Active filters display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {localFilters.search && (
              <Badge variant="secondary" className="text-xs">
                Search: "{localFilters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.type && (
              <Badge variant="secondary" className="text-xs">
                Type: {localFilters.type}
                <button
                  onClick={() => handleFilterChange("type", "")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.categoryId && (
              <Badge variant="secondary" className="text-xs">
                Category:{" "}
                {categories.find((c) => c.id === localFilters.categoryId)?.name}
                <button
                  onClick={() => handleFilterChange("categoryId", "")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.startDate && (
              <Badge variant="secondary" className="text-xs">
                From: {format(localFilters.startDate, "MMM d")}
                <button
                  onClick={() => handleFilterChange("startDate", null)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {localFilters.endDate && (
              <Badge variant="secondary" className="text-xs">
                To: {format(localFilters.endDate, "MMM d")}
                <button
                  onClick={() => handleFilterChange("endDate", null)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col flex-grow">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Scrollable Transactions Area */}
            <div className="flex-grow overflow-hidden">
              <div className="h-96 overflow-y-auto pr-2 space-y-4">
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">
                      {hasActiveFilters
                        ? "No transactions match your filters"
                        : "No transactions found"}
                    </div>
                    {hasActiveFilters && onClearFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                      >
                        Clear filters to see all transactions
                      </Button>
                    )}
                  </div>
                ) : (
                  transactions
                    .filter((transaction) =>
                      transaction.description
                        .toLowerCase()
                        .includes(localFilters.search.toLowerCase())
                    )
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: transaction.category.color,
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">
                              {transaction.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.category.name} •{" "}
                              {format(
                                new Date(transaction.date),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right flex-shrink-0">
                            <p
                              className={cn(
                                "font-semibold",
                                transaction.type === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {transaction.type === "income" ? "+" : "-"}₹
                              {transaction.amount.toFixed(2)}
                            </p>
                            <Badge
                              variant={
                                transaction.type === "income"
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {transaction.type}
                            </Badge>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(transaction)}
                            className="rounded-full hover:bg-muted transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <EditTransactionModal
              open={modalOpen}
              onClose={handleModalClose}
              onSave={handleModalSave}
              transaction={editingTransaction}
              categories={categories}
            />
            {/* Enhanced Pagination */}
            {pagination.pages > 1 && (
              <div className="flex-shrink-0 mt-6 space-y-4">
                {/* Results info */}
                <p className="text-sm text-muted-foreground text-center">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} transactions
                </p>

                {/* Pagination controls */}
                <div className="flex items-center justify-center space-x-1">
                  {/* First page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={!canGoToFirstPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>

                  {/* Previous page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!canGoToPreviousPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page numbers */}
                  {getVisiblePages().map((page, index) => (
                    <Button
                      key={index}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        typeof page === "number" && handlePageChange(page)
                      }
                      disabled={typeof page !== "number"}
                      className="h-8 min-w-8"
                    >
                      {page}
                    </Button>
                  ))}

                  {/* Next page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!canGoToNextPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {/* Last page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.pages)}
                    disabled={!canGoToLastPage}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
