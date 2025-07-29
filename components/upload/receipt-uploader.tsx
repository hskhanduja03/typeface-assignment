"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileImage,
  FileText,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";


interface ReceiptUploaderProps {
  onUpload: (
    file: File,
    updateStatus: (status: "success" | "error") => void
  ) => void;
  loading?: boolean;
}

export function ReceiptUploader({ onUpload, loading }: ReceiptUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{
      file: File;
      status: "uploading" | "success" | "error";
      extractedTransactions?: any[];
    }>
  >([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const index = uploadedFiles.length;
        setUploadedFiles((prev) => [...prev, { file, status: "uploading" }]);

        const updateStatus = (newStatus: "success" | "error") => {
          setUploadedFiles((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], status: newStatus };
            return updated;
          });
        };

        onUpload(file, updateStatus);
      });
    },
    [onUpload, uploadedFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg"],
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: loading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const trimFileName = (name: string, maxLength = 30) => {
    if (name.length <= maxLength) return name;
    const ext = name.split(".").pop();
    return `${name.slice(0, 13)}.${ext}`;
  };

  return (
    <div className="space-y-6">
      <div
        className={loading ? "grayscale opacity-60 pointer-events-none" : ""}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Receipt</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="mx-auto max-w-md">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the files here...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop receipts here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports images (PNG, JPG) and PDF files up to 10MB
                    </p>
                    <Button variant="outline">Choose Files</Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setPreviewImage(null)}
        >
          <Image
            src={previewImage}
            alt="Preview"
            width={400}
            height={400}
            className="max-w-[90%] max-h-[90%] object-contain rounded-lg shadow-lg"
          />
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadedFiles.map((item, index) => {
                const isImage = item.file.type.startsWith("image/");
                const imageUrl = isImage
                  ? URL.createObjectURL(item.file)
                  : null;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {isImage ? (
                        <Image
                          src={imageUrl!}
                          alt="Thumbnail"
                          width={40}
                          height={40}
                          className="h-12 w-12 object-cover rounded cursor-pointer hover:scale-105 transition"
                          onClick={() => setPreviewImage(imageUrl!)}
                        />
                      ) : (
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">
                          {trimFileName(item.file.name)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(item.file.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.status === "uploading" && (
                        <Badge
                          variant="secondary"
                          className="flex items-center space-x-1"
                        >
                          <Loader className="h-3 w-3 animate-spin" />
                          <span>Processing...</span>
                        </Badge>
                      )}
                      {item.status === "success" && (
                        <Badge
                          variant="default"
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Success</span>
                        </Badge>
                      )}
                      {item.status === "error" && (
                        <Badge
                          variant="destructive"
                          className="flex items-center space-x-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>No content</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
