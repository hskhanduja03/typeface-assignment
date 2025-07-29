"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: "income" | "expense";
  date: string;
  category: {
    id: string;
    name: string;
    color: string;
  };
  merchant?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function EditTransactionModal({
  open,
  onClose,
  onSave,
  transaction,
  categories,
  defaultCategory,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  transaction: Transaction | null;
  categories: Category[];
  defaultCategory?: Category;
  defaultType?: "expense" | "income";
}) {
  const [form, setForm] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (transaction) {
      setForm({
        ...transaction,
        category: transaction.category || defaultCategory,
        type: transaction.type || defaultType || "expense",
      });
    }
  }, [transaction, defaultCategory, defaultType]);


  if (!form) return null;

  const handleChange = (field: keyof Transaction, value: any) => {
    setForm((prev) => prev && { ...prev, [field]: value });
  };

  const handleCategoryChange = (categoryId: string) => {
    const selected = categories.find((c) => c.id === categoryId);
    if (selected) {
      setForm((prev) => prev && { ...prev, category: selected });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full h-[95vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={form.amount}
              onChange={(e) =>
                handleChange("amount", parseFloat(e.target.value))
              }
              placeholder="Amount"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => handleChange("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={form.category?.id || ""}
              onValueChange={(value) => handleCategoryChange(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
                <div
                  onClick={() => router.push("/settings")}
                  className="flex items-center justify-start px-3 py-2 cursor-pointer text-sm bg-white hover:bg-white/80 text-black transition-colors rounded-md mt-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Add Category</span>
                </div>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start w-full text-left"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.date
                    ? format(new Date(form.date), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={new Date(form.date)}
                  onSelect={(date) => {
                    if (date) handleChange("date", date.toISOString());
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  await onSave(form); // assuming this can be async
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
