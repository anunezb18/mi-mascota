import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api-client";
import { TIPO_REGISTRO_MEDICO_LABEL } from "@/lib/labels";
import type { TipoRegistroMedico } from "@/types";

import { type RegistroMedicoValues, registroMedicoSchema } from "../schemas";

interface MedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nombreMascota?: string;
  /** Guarda el registro. Si lanza un error, se muestra dentro del diálogo. */
  onSave: (registro: RegistroMedicoValues) => Promise<void> | void;
}

export function MedicalRecordDialog({ open, onOpenChange, nombreMascota, onSave }: MedicalRecordDialogProps) {
  const form = useForm<RegistroMedicoValues>({
    resolver: zodResolver(registroMedicoSchema),
    defaultValues: { fecha: new Date().toISOString().slice(0, 10), descripcion: "", veterinario: "" },
  });
  const { errors, isSubmitting } = form.formState;

  React.useEffect(() => {
    if (open) form.reset({ fecha: new Date().toISOString().slice(0, 10), descripcion: "", veterinario: "" });
  }, [open, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      onOpenChange(false);
    } catch (error) {
      form.setError("root", { message: getErrorMessage(error) });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar registro médico</DialogTitle>
          <DialogDescription>
            {nombreMascota
              ? `Se agregará al historial médico de ${nombreMascota}.`
              : "Se agregará al historial médico de la nueva mascota."}
          </DialogDescription>
        </DialogHeader>

        {/* El diálogo se monta en un portal, pero React propaga el submit al formulario
            padre (el de la mascota); se detiene aquí para no enviarlo por error. */}
        <form
          id="form-registro-medico"
          onSubmit={(e) => {
            e.stopPropagation();
            void onSubmit(e);
          }}
          noValidate
          className="grid gap-4 sm:grid-cols-2"
        >
          {errors.root && (
            <Alert variant="destructive" className="sm:col-span-2">
              {errors.root.message}
            </Alert>
          )}
          <FormField label="Fecha" error={errors.fecha?.message} required>
            <Input type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("fecha")} />
          </FormField>
          <Controller
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormField label="Tipo" error={errors.tipo?.message} required>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger onBlur={field.onBlur}>
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_REGISTRO_MEDICO_LABEL) as TipoRegistroMedico[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_REGISTRO_MEDICO_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            )}
          />
          <FormField label="Descripción" error={errors.descripcion?.message} required className="sm:col-span-2">
            <Textarea rows={3} placeholder="Ej. Vacuna antirrábica, lote 2231. Próximo refuerzo en un año." {...form.register("descripcion")} />
          </FormField>
          <FormField label="Veterinario(a)" error={errors.veterinario?.message} className="sm:col-span-2">
            <Input placeholder="Nombre de quien realizó el procedimiento" {...form.register("veterinario")} />
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="form-registro-medico" loading={isSubmitting}>
            <Plus aria-hidden="true" />
            Agregar registro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
