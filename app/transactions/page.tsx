"use client";

import { useEffect, useState } from "react";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Filters {
  search: string;
  type: string;
  categoryId: string;
  startDate: Date | null;
  endDate: Date | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<Filters>({
    search: "",
    type: "",
    categoryId: "",
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?userId=demo-user");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    }
  };  

  const buildFilterParams = (filters: Filters) => {
    const params: Record<string, string> = {
      userId: "demo-user",
    };

    // Add search filter
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    // Add type filter
    if (filters.type) {
      params.type = filters.type;
    }

    // Add category filter
    if (filters.categoryId) {
      params.categoryId = filters.categoryId;
    }

    // Add date filters
    if (filters.startDate) {
      params.startDate = format(filters.startDate, "yyyy-MM-dd");
    }

    if (filters.endDate) {
      params.endDate = format(filters.endDate, "yyyy-MM-dd");
    }

    return params;
  };

  const fetchTransactions = async (
    filters: Filters = currentFilters,
    page: number = 1
  ) => {
    try {
      setLoading(true);

      const filterParams = buildFilterParams(filters);
      const params = new URLSearchParams({
        ...filterParams,
        page: page.toString(),
        limit: "10",
      });

      console.log("Fetching with params:", params.toString());

      const response = await fetch(`/api/transactions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        toast.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (data: any) => {
    if (data.amount == 0) {
      toast.error("Amount cannot be 0");
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          userId: "demo-user",
        }),
      });

      if (response.ok) {
        toast.success("Transaction added successfully!");
        // Refresh with current filters and reset to page 1
        fetchTransactions(currentFilters, 1);
      } else {
        const errorData = await response.json();
        console.error("Add transaction error:", errorData);
        toast.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
    fetchTransactions(currentFilters, page);
  };

  const handleFilterChange = (filters: Filters) => {
    console.log("Filter change:", filters); // Debug log
    setCurrentFilters(filters);
    // Reset to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions(filters, 1);
  };

  const handleClearFilters = () => {
    const emptyFilters: Filters = {
      search: "",
      type: "",
      categoryId: "",
      startDate: null,
      endDate: null,
    };
    setCurrentFilters(emptyFilters);
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions(emptyFilters, 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-2">
          Manage your income and expenses
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TransactionForm
            categories={categories}
            onSubmit={handleAddTransaction}
            loading={submitting}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <TransactionList
            transactions={transactions}
            categories={categories}
            pagination={pagination}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            loading={loading}
            currentFilters={currentFilters}
            setTransactions={setTransactions}
          />
        </motion.div>
      </div>
    </div>
  );
}
