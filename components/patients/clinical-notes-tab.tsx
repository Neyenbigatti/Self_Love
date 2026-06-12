"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  AlertCircle,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ClinicalNoteItem {
  id: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ClinicalNotesTabProps {
  patientId: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ClinicalNotesTab({ patientId }: ClinicalNotesTabProps) {
  const [notes, setNotes] = useState<ClinicalNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline create state
  const [creating, setCreating] = useState(false);
  const [newDate, setNewDate] = useState(todayISO());
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit dialog state
  const [editingNote, setEditingNote] = useState<ClinicalNoteItem | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Delete dialog state
  const [deletingNote, setDeletingNote] = useState<ClinicalNoteItem | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ── Fetch notes ──────────────────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/clinical-notes`,
      );
      if (!res.ok) {
        let msg = "Error al cargar notas clínicas";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          // use default
        }
        throw new Error(msg);
      }
      const data = await res.json();
      setNotes(data.notes ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar notas clínicas",
      );
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ── Create note ──────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/clinical-notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: newDate, content: newContent.trim() }),
        },
      );
      if (!res.ok) {
        let msg = "Error al crear nota";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          // use default
        }
        throw new Error(msg);
      }
      setNewContent("");
      setNewDate(todayISO());
      setCreating(false);
      await fetchNotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear nota",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Edit note ────────────────────────────────────────────────────────────
  const handleEditOpen = (note: ClinicalNoteItem) => {
    setEditingNote(note);
    setEditContent(note.content);
  };

  const handleEditSave = async () => {
    if (!editingNote || !editContent.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/clinical-notes/${editingNote.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        },
      );
      if (!res.ok) {
        let msg = "Error al actualizar nota";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          // use default
        }
        throw new Error(msg);
      }
      setEditingNote(null);
      setEditContent("");
      await fetchNotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al actualizar nota",
      );
    } finally {
      setEditSaving(false);
    }
  };

  // ── Delete note ──────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingNote) return;
    setDeleteSaving(true);
    try {
      const res = await fetch(
        `/api/patients/${encodeURIComponent(patientId)}/clinical-notes/${deletingNote.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        let msg = "Error al eliminar nota";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {
          // use default
        }
        throw new Error(msg);
      }
      setDeletingNote(null);
      await fetchNotes();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al eliminar nota",
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <AlertCircle className="size-12 text-destructive mb-4" />
          <h3 className="font-medium mb-2">
            Error al cargar notas clínicas
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={fetchNotes}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Create button ─────────────────────────────────────────────── */}
      {!creating && (
        <Button
          variant="outline"
          onClick={() => setCreating(true)}
          className="w-full"
        >
          <Plus className="size-4 mr-2" />
          + Nueva Nota
        </Button>
      )}

      {/* ── Inline create form ────────────────────────────────────────── */}
      {creating && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nueva Nota Clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Fecha
              </label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Contenido
              </label>
              <Textarea
                placeholder="Escribí la nota clínica..."
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCreating(false);
                  setNewContent("");
                  setNewDate(todayISO());
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={saving || !newContent.trim()}
              >
                {saving && (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                )}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Notes list or empty state ─────────────────────────────────── */}
      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FileText className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">
            Sin notas clínicas registradas
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Todavía no se registraron notas clínicas para este paciente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {format(
                      new Date(note.date + "T00:00:00"),
                      "MMMM d, yyyy",
                    )}
                  </CardTitle>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => handleEditOpen(note)}
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingNote(note)}
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Edit Dialog ──────────────────────────────────────────────── */}
      <Dialog
        open={editingNote !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingNote(null);
            setEditContent("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Nota Clínica</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              rows={6}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Contenido de la nota..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingNote(null);
                setEditContent("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving || !editContent.trim()}
            >
              {editSaving && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────────────── */}
      <AlertDialog
        open={deletingNote !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingNote(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La nota se eliminará
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSaving && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
