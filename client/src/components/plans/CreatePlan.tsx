import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/use-auth';
import { apiClient } from '../../lib/api';
import { type StudyPlanProposal } from '../../lib/types';
import { SectionTree } from '../sections/SectionTree';
import { ResourceCard } from '../resources/ResourceCard';
import { Loader2, Sparkles, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  topic: z.string().min(2, {
    message: "El tema debe tener al menos 2 caracteres.",
  }),
  message: z.string().min(10, {
    message: "La descripción debe tener al menos 10 caracteres.",
  }),
});

interface CreatePlanProps {
  onBack: () => void;
  onPlanCreated: (planId?: string) => void;
}

export function CreatePlan({ onBack, onPlanCreated }: CreatePlanProps) {
  const { user } = useAuth();
  const [proposal, setProposal] = useState<StudyPlanProposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    try {
      const result = await apiClient.generatePlanWithAI({
        topic: values.topic,
        message: values.message,
      });
      setProposal(result);
      toast.success("Plan generado exitosamente");
    } catch (error) {
      toast.error("Error al generar el plan");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    if (!proposal || !user) return;

    setIsSaving(true);
    try {
      const newPlan = await apiClient.createStudyPlan({
        ...proposal,
        user_id: user.id,
      });
      toast.success("Plan guardado exitosamente");
      onPlanCreated(newPlan.id);
    } catch (error) {
      toast.error("Error al guardar el plan");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Volver
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Plan de Estudio</CardTitle>
              <CardDescription>
                Describe qué quieres aprender y la IA generará un plan personalizado para ti.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema Principal</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: React, Python, Historia del Arte..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detalles y Objetivos</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe tus objetivos, nivel actual, tiempo disponible, etc..." 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 size-4" />
                        Generar Plan
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {proposal ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-blue-900">Vista Previa del Plan</CardTitle>
                  <CardDescription>
                    Revisa el plan generado antes de guardarlo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{proposal.title}</h3>
                      <p className="text-sm text-muted-foreground">{proposal.description}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 size-4" />
                            Guardar Plan
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isGenerating || isSaving}
                        title="Regenerar"
                      >
                        <RefreshCw className={cn("size-4", isGenerating && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contenido Propuesto</h3>
                {proposal.sections.map((section, index) => (
                  <SectionTree 
                    key={index} 
                    section={section} 
                  />
                ))}
              </div>

              {proposal.resources && proposal.resources.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Recursos Recomendados</h3>
                  <div className="grid gap-3">
                    {proposal.resources.map((resource, index) => (
                      <ResourceCard 
                        key={index} 
                        resource={resource} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl text-muted-foreground min-h-[400px]">
              <Sparkles className="size-12 mb-4 text-muted-foreground/50" />
              <h3 className="font-medium text-lg mb-2">Tu plan aparecerá aquí</h3>
              <p className="text-sm max-w-xs">
                Completa el formulario y presiona "Generar Plan" para ver la propuesta de la IA.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
