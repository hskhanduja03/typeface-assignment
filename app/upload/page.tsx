"use client";

import { useEffect, useState } from "react";
import { ReceiptUploader } from "@/components/upload/receipt-uploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle, Plus, Pencil } from "lucide-react";
import EditTransactionModal from "@/components/ui/EditTransactionModal";

export interface ExtractedTransaction {
  id?:string;
  amount: number;
  description: string;
  date: string;
  merchant?: string;
  type?: "income" | "expense";
  category?: {
    id: string;
    name: string;
    color: string;
  };
}

export default function UploadPage() {
  const [extractedTransactions, setExtractedTransactions] = useState<
    ExtractedTransaction[]
  >([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<ExtractedTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const openEditModal = (transaction: ExtractedTransaction, index: number) => {
    setEditingTransaction(transaction);
    setEditIndex(index);
    setIsModalOpen(true);
  };

  const handleSaveEdit = (updatedTransaction: ExtractedTransaction) => {
    setExtractedTransactions((prev) =>
      prev.map((t, idx) => (idx === editIndex ? updatedTransaction : t))
    );
    setIsModalOpen(false);
    toast.success("Transaction updated.");
  };

  const handleFileUpload = async (
    file: File,
    updateStatus: (status: "success" | "error") => void
  ) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", "demo-user");

      const response = await fetch("/api/receipts/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const transactions = data.extractedTransactions || [];

        if (transactions.length === 0) {
          toast.error("No content found in receipt. File was not saved.");
          updateStatus("error");
          return;
        }

        setExtractedTransactions((prev) => [...prev, ...transactions]);
        toast.success("Receipt uploaded and processed successfully!");
        updateStatus("success");
      } else {
        toast.error("Failed to upload receipt");
        updateStatus("error");
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Failed to upload receipt");
      updateStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (transaction: ExtractedTransaction) => {
    if (transaction.amount === 0) {
      toast.error("Amount cannot be 0");
      return;
    }
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: transaction.amount.toString(),
          description: transaction.description,
          type: "expense",
          date: new Date(transaction.date).toISOString(),
          categoryId: "default-category-id",
          userId: "demo-user",
        }),
      });

      if (response.ok) {
        toast.success("Transaction added successfully!");
        // Remove the transaction from the extracted list
        setExtractedTransactions((prev) =>
          prev.filter((t) => t !== transaction)
        );
      } else {
        toast.error("Failed to add transaction");
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  useEffect(() => {
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
    fetchCategories();
  }, []);

  const defaultCategory = categories.length > 0 ? categories[0] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <EditTransactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEdit}
        transaction={editingTransaction}
        categories={categories}
        defaultCategory={defaultCategory}
        defaultType="expense"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold">Upload Receipt</h1>
        <p className="text-muted-foreground mt-2">
          Upload receipts to automatically extract transaction data
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ReceiptUploader onUpload={handleFileUpload} loading={loading} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          {extractedTransactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Extracted Transactions</span>
                  <Badge variant="secondary">
                    {extractedTransactions.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {extractedTransactions.map((transaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{transaction.amount.toFixed(2)} • {transaction.date}
                        </p>
                        {transaction.merchant && (
                          <p className="text-xs text-muted-foreground">
                            {transaction.merchant}
                          </p>
                        )}
                        {transaction.category && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              style={{
                                backgroundColor:
                                  transaction.category.color || "#E5E7EB",
                                color: "#111",
                              }}
                              className="text-xs"
                            >
                              {transaction.category.name}
                            </Badge>
                            {transaction.type && (
                              <Badge
                                variant={
                                  transaction.type === "income"
                                    ? "default"
                                    : "destructive"
                                }
                                className="text-xs capitalize"
                              >
                                {transaction.type}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => openEditModal(transaction, index)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddTransaction(transaction)}
                          className="flex items-center space-x-1"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
