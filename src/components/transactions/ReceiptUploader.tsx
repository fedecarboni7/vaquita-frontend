import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Eye, Image as ImageIcon, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { deleteReceipt, getReceiptUrl, uploadReceipt } from "@/hooks/useTransactions";

interface ReceiptUploaderProps {
  transactionId: string;
  currentReceiptUrl?: string | null;
  onUploadSuccess: (newUrl: string) => void;
  onDeleteSuccess: () => void;
}

const MAX_RECEIPT_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ReceiptUploader({
  transactionId,
  currentReceiptUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: ReceiptUploaderProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasReceipt, setHasReceipt] = useState(Boolean(currentReceiptUrl));
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setHasReceipt(Boolean(currentReceiptUrl));
  }, [currentReceiptUrl]);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Solo se aceptan JPG, PNG o WEBP");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      toast.error("El comprobante debe pesar hasta 10MB");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setConfirmDelete(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    setIsUploading(true);

    try {
      const response = await uploadReceipt(transactionId, selectedFile);
      onUploadSuccess(response.receipt_url);
      setHasReceipt(true);
      clearSelection();
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Comprobante subido correctamente");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo subir el comprobante";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleView = async () => {
    setIsViewing(true);

    try {
      const response = await getReceiptUrl(transactionId);
      window.open(response.receipt_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir el comprobante";
      toast.error(message);
    } finally {
      setIsViewing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteReceipt(transactionId);
      onDeleteSuccess();
      setHasReceipt(false);
      setConfirmDelete(false);
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Comprobante eliminado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el comprobante";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {selectedFile ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Vista previa del comprobante"
                className="h-16 w-16 rounded-md object-cover border border-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-background">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Subir comprobante
            </Button>
            <Button type="button" variant="outline" onClick={clearSelection} disabled={isUploading}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : hasReceipt ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Comprobante adjunto</span>
          </div>

          {confirmDelete ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar eliminacion
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleView} disabled={isViewing}>
                {isViewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eye className="mr-2 h-4 w-4" />}
                Ver comprobante
              </Button>
              <Button type="button" variant="outline" onClick={openFilePicker}>
                <Upload className="mr-2 h-4 w-4" />
                Reemplazar
              </Button>
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
            <span>Adjunta un comprobante (JPG, PNG o WEBP)</span>
          </div>
          <Button type="button" variant="outline" onClick={openFilePicker}>
            <Upload className="mr-2 h-4 w-4" />
            Seleccionar archivo
          </Button>
        </div>
      )}
    </div>
  );
}
