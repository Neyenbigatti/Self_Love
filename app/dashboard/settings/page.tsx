"use client";

import { TemplateEditor } from "@/components/exploration/template-editor";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">
          Administrá las plantillas de exploración física
        </p>
      </div>
      <TemplateEditor />
    </div>
  );
}
