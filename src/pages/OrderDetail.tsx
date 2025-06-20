
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import {
  ChevronLeft,
  Ban,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  ArrowRight,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { Addition } from '@/models/order.model';
import CancelOrderConfirmation from '@/components/CancelOrderConfirmation';
import { invoiceService } from '@/services/invoiceService';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: orderData, isLoading, error } = useOrderDetail(id!, {
    enabled: Boolean(id),
  });

  const updateOrderStatus = useUpdateOrderStatus(id!);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Pendiente': return 'Preparando';    // 1 -> 2
      case 'Preparando': return 'Entregado';    // 2 -> 3  
      case 'Entregado': return 'Finalizado';    // 3 -> 5
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Pendiente': return 'Iniciar Preparación';
      case 'Preparando': return 'Marcar como Entregado';
      case 'Entregado': return 'Finalizar';
      default: return null;
    }
  };

  const handleNextStatus = async () => {
    const nextStatus = getNextStatus(order.estado);
    if (!nextStatus) return;

    // Mapear estados en español a IDs de estado que espera el backend
    const statusIdMap: Record<string, number> = {
      'Pendiente': 1,
      'Preparando': 2,
      'Entregado': 3,
      'Finalizado': 5,
      'Cancelado': 4
    };

    const estadoId = statusIdMap[nextStatus];
    if (!estadoId) return;

    try {
      await updateOrderStatus.mutateAsync(estadoId);
      toast.success(`Estado de orden ${order.id_pedido} actualizado`);
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error updating status:', error);
    }
  };
  const handleDownloadInvoice = async () => {
    try {
      // Verificar que id_venta existe
      if (!order.id_venta) {
        toast.error('ID de venta no disponible');
        return;
      }

      // Asegurarse de que id_venta es un número
      const id_venta = typeof order.id_venta === 'string' ? parseInt(order.id_venta, 10) : order.id_venta;
      if (isNaN(id_venta)) {
        toast.error('ID de venta inválido');
        return;
      }

      const response = await invoiceService.generateInvoice(id_venta);
      if (response.success && response.data && response.data.base64) {
        const pdfBlob = new Blob([Uint8Array.from(atob(response.data.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `factura-${order.id_pedido}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Factura descargada');
      } else {
        toast.error('Error al obtener la factura de la respuesta');
        console.error('Invalid response structure for invoice:', response);
      }
    } catch (error) {
      toast.error('Error al descargar la factura');
      console.error('Error downloading invoice:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await updateOrderStatus.mutateAsync(4); // ID 4 = Cancelado
      toast.success(`Orden ${order.id_pedido} cancelada`);
      setShowCancelDialog(false);
    } catch (error) {
      toast.error('Error al cancelar la orden');
      console.error('Error canceling order:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error || !orderData) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-destructive">
          Error cargando la orden
        </h2>
        <p className="text-muted-foreground mt-2">
          Inténtalo de nuevo más tarde
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/orders')}
        >
          Volver
        </Button>
      </div>
    );
  }
  const order = orderData.order;
  const orderItems = orderData.items;

  const nextStatus = getNextStatus(order.estado);
  const nextStatusLabel = getNextStatusLabel(order.estado);
  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Preparando':
        return <RefreshCw className="h-5 w-5 text-blue-500" />;
      case 'Entregado':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'Cancelado':
        return <Ban className="h-5 w-5 text-red-500" />;
      case 'Finalizado':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/orders')}
          className="mr-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold">Pedido #{order.id_pedido}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">          <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold">Detalle de la orden</h2>
          </div><div className="flex items-center space-x-2">
            {getStatusIcon(order.estado)}
            <span className="capitalize font-medium">
              {order.estado}
            </span>
          </div>
        </div>

          <Separator className="my-4" />
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Cliente</h3>
              <p>{order.nombre_cliente}</p>
            </div>

            {order.nombre_mesa && order.nombre_mesa !== 'Para llevar' && (
              <div>
                <h3 className="font-medium">Mesa</h3>
                <p>{order.nombre_mesa}</p>
              </div>
            )}

            {order.nombre_mesa === 'Para llevar' && (
              <div>
                <h3 className="font-medium">Tipo</h3>
                <p>Para llevar</p>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Artículos</h3>
              <div className="border rounded-md">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-2 px-4">Producto</th>
                        <th className="text-center p-2">Cantidad</th>
                        <th className="text-right p-2 px-4">Precio</th>
                        <th className="text-right p-2 px-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <React.Fragment key={`${item.productId}-${index}`}>
                          <tr className="border-t">
                            <td className="p-2 px-4">{item.name}</td>
                            <td className="text-center p-2">{item.quantity}</td>                            <td className="text-right p-2 px-4">{formatCurrency(item.price)}</td>
                            <td className="text-right p-2 px-4">{formatCurrency(item.total)}</td>
                          </tr>
                          {item.additions && item.additions.length > 0 && (
                            <tr className="bg-muted/30">
                              <td colSpan={4} className="p-2 px-6">
                                <div className="text-sm text-muted-foreground">
                                  <span className="font-medium">Adiciones:</span>{' '}
                                  {item.additions.map((addition: Addition, i: number) => (
                                    <React.Fragment key={`addition-${addition.id}`}>
                                      {addition.name} (x{addition.quantity}) (+{formatCurrency(addition.price)})
                                      {i < item.additions!.length - 1 ? ', ' : ''}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>              </div>

              <div className="mt-4 text-right">                <p className="text-xl font-bold">
                  Total: {formatCurrency(orderItems.reduce((sum, item) => sum + item.total, 0))}
                </p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Gestionar pedidos</h2>
          <div className="space-y-4">

            {/* Botón de siguiente estado */}
            {nextStatus && (
              <Button
                variant="default"
                onClick={handleNextStatus}
                disabled={updateOrderStatus.isPending}
                className="w-full flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                {nextStatusLabel}
              </Button>
            )}            {/* Botón de descargar factura para órdenes finalizadas */}
            {order.estado === 'Finalizado' && order.id_venta && (
              <Button
                variant="default"
                onClick={handleDownloadInvoice}
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600"
              >
                <Download className="h-4 w-4" />
                Descargar Factura
              </Button>
            )}

            {/* Botón de cancelar para órdenes no canceladas ni finalizadas */}
            {order.estado !== 'Cancelado' && order.estado !== 'Finalizado' && (
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <Ban className="h-4 w-4" />
                Cancelar Orden
              </Button>)}

            {/* Botón de editar orden - solo para órdenes no finalizadas */}
            {order.estado !== 'Finalizado' && (
              <div className="pt-4 border-t">
                <Link to={`/orders/${order.id_pedido}/edit`}>
                  <Button variant="secondary" className="w-full">
                    Editar orden
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal de confirmación de cancelación */}
      <CancelOrderConfirmation
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
      />
    </div>
  );
};

export default OrderDetail;
