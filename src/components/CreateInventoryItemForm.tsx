
import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateProduct, useCategories } from "@/hooks/useProducts";
import { Package, Tag, DollarSign, Hash, FileText, Settings } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres" }),
  category: z.string().min(1, { message: "La categoría es obligatoria" }),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "El precio debe ser un número positivo",
  }),
  stockQuantity: z.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: "La cantidad debe ser un número entero positivo",
  }),
  description: z.string().min(1, { message: "La descripción es obligatoria" }),
  managesInventory: z.boolean().default(true),
});

interface CreateInventoryItemFormProps {
  onClose: () => void;
}

const CreateInventoryItemForm: React.FC<CreateInventoryItemFormProps> = ({ onClose }) => {
  const { data: categoriesData } = useCategories();
  const createProductMutation = useCreateProduct();

  // Transform categories data to the format expected by the component
  const categories = React.useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.map(category => ({
      id: category.id_categoria,
      name: category.nombre_categoria
    }));
  }, [categoriesData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      stockQuantity: "",
      description: "",
      managesInventory: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createProductMutation.mutateAsync({
        nombre: values.name,
        descripcion: values.description,
        precio: values.price,
        stock: values.stockQuantity,
        maneja_inventario: values.managesInventory,
        id_categoria: values.category,
      });

      toast.success("Producto agregado correctamente");
      onClose();
    } catch (error) {
      toast.error("Error al agregar el producto. Intenta nuevamente.");
      console.error("Error creating product:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Nombre del producto
                </FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Categoría
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precio (COP)
                </FormLabel>
                <FormControl>
                  <CurrencyInput
                    value={field.value}
                    onValueChange={(value) => field.onChange(value.toString())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Cantidad
                </FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Descripción
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el producto..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="managesInventory"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Maneja Inventario
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Activa esta opción si el producto tiene stock limitado
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={createProductMutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createProductMutation.isPending}>
            {createProductMutation.isPending ? "Guardando..." : "Guardar producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateInventoryItemForm;
