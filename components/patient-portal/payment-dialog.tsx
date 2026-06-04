"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Upload, X, Check, QrCode, Copy, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onSubmit: (file: File) => void;
}

const mockBankInfo = {
  bank: "Banco Santander",
  accountHolder: "SelfLove Clinic S.L.",
  iban: "ES12 0049 1234 5678 9012 3456",
  concept: "Reserva Cita",
  amount: "50.00",
};

export function PaymentDialog({
  open,
  onOpenChange,
  appointment,
  onSubmit,
}: PaymentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
      clearFile();
      onOpenChange(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Comprobante de Pago</DialogTitle>
          <DialogDescription>
            Completá tu reserva para{" "}
            <span className="font-medium text-foreground">
              {appointment.treatmentType}
            </span>{" "}
            del{" "}
            <span className="font-medium text-foreground">
              {format(appointment.date, "d MMMM yyyy")}
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="transfer" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transfer">Transferencia Bancaria</TabsTrigger>
            <TabsTrigger value="bizum">Bizum</TabsTrigger>
          </TabsList>

          <TabsContent value="transfer" className="mt-4 space-y-4">
            {/* QR Code */}
            <div className="flex flex-col items-center rounded-lg bg-secondary p-6">
              <div className="flex size-32 items-center justify-center rounded-lg bg-card">
                <QrCode className="size-24 text-foreground" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Escaneá el código QR con tu app bancaria
              </p>
            </div>

            {/* Bank Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Banco</p>
                  <p className="font-medium">{mockBankInfo.bank}</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">IBAN</p>
                  <p className="font-mono text-sm font-medium">{mockBankInfo.iban}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy(mockBankInfo.iban, "iban")}
                >
                  {copied === "iban" ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Concepto</p>
                  <p className="font-medium">
                    {mockBankInfo.concept} - {appointment.id}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    handleCopy(`${mockBankInfo.concept} - ${appointment.id}`, "concept")
                  }
                >
                  {copied === "concept" ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-accent/10 p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Monto</p>
                  <p className="text-lg font-semibold text-accent">
                    {mockBankInfo.amount} EUR
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bizum" className="mt-4 space-y-4">
            <div className="flex flex-col items-center rounded-lg bg-secondary p-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent">
                <Smartphone className="size-8 text-accent-foreground" />
              </div>
              <p className="mt-4 text-lg font-semibold">Enviar Bizum a</p>
              <p className="text-2xl font-bold text-accent">+34 612 345 678</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Monto: {mockBankInfo.amount} EUR
              </p>
              <p className="text-sm text-muted-foreground">
                Concepto: {mockBankInfo.concept} - {appointment.id}
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Section */}
        <div className="mt-6 space-y-3">
          <Label>Subir Comprobante de Pago</Label>
          
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
                isDragging
                  ? "border-accent bg-accent/10"
                  : "border-border hover:border-accent/50 hover:bg-secondary/50"
              )}
            >
              <Upload className="size-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Soltá tu archivo acá o hacé clic para subir
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Formatos: JPG, PNG, PDF (máx. 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <div className="relative rounded-lg border bg-secondary/50 p-4">
              <button
                onClick={clearFile}
                className="absolute right-2 top-2 rounded-full bg-card p-1 shadow-sm hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
              
              {previewUrl ? (
                <img
                  src={previewUrl}
                    alt="Vista previa del comprobante"
                  className="mx-auto max-h-48 rounded-lg object-contain"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-secondary">
                    <Upload className="size-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Check className="mr-2 size-4" />
            Enviar Comprobante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
