
import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import SearchAndFilter from './ui/SearchAndFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useNetwork } from '@/hooks/useNetwork';
import { useOrders } from '@/hooks/useOrders';
import OrderCard from './OrderCard';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface OrderListProps {
  limit?: number;
  showCreateButton?: boolean;
}

const ITEMS_PER_PAGE = 10;

const OrderList: React.FC<OrderListProps> = ({
  limit,
  showCreateButton = true
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Verificar conectividad de red
  const { isOnline } = useNetwork();

  // Usar React Query para obtener las ordenes
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch
  } = useOrders();
  // Estado para ordenes filtradas usando useMemo para evitar re-renders innecesarios
  const filteredOrders = useMemo(() => {
    console.log('Filtering orders. Raw orders:', orders, 'Search query:', searchQuery, 'Active filters:', activeFilters);

    if (!orders || !Array.isArray(orders)) {
      console.log('No orders available or not array');
      return [];
    }

    let result = [...orders];

    // Aplicar filtro de busqueda
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order => {
        if (!order) return false;

        const idMatch = order.id_pedido?.toString()?.toLowerCase()?.includes(query) || false;
        const clientMatch = order.nombre_cliente?.toLowerCase()?.includes(query) || false;
        const tableMatch = order.nombre_mesa?.toLowerCase()?.includes(query) || false;

        return idMatch || clientMatch || tableMatch;
      });
      console.log('After search filter:', result.length, 'orders');
    }

    // Aplicar filtro de estado
    if (activeFilters.status && activeFilters.status.trim()) {
      result = result.filter(order => order?.estado === activeFilters.status);
    }

    // Aplicar filtro de tipo de orden
    if (activeFilters.orderType && activeFilters.orderType.trim()) {
      if (activeFilters.orderType === 'En Mesa') {
        result = result.filter(order =>
          order?.tipo_pedido === 'en_mesa' ||
          (order?.nombre_mesa && order.nombre_mesa !== 'Para llevar')
        );
      } else if (activeFilters.orderType === 'Para llevar') {
        result = result.filter(order =>
          order?.tipo_pedido === 'para_llevar' ||
          order?.nombre_mesa === 'Para llevar'
        );
      }
    }

    // Definir el orden de prioridad de estados
    const statusOrder = {
      'Pendiente': 1,     // Pendiente
      'Entregado': 2,     // Entregado
      'Finalizado': 3,    // Finalizado
      'Cancelado': 4      // Cancelado
    };

    // Aplicar ordenamiento por defecto por estado, luego por filtro personalizado si existe
    result.sort((a, b) => {
      // Verificar que ambos objetos existan
      if (!a || !b) return 0;

      // Si hay filtro de ordenamiento personalizado, aplicarlo
      if (activeFilters._sort) {
        const aId = a.id_pedido?.toString() || '';
        const bId = b.id_pedido?.toString() || '';

        if (activeFilters._sort === 'asc') {
          return aId.localeCompare(bId);
        } else {
          return bId.localeCompare(aId);
        }
      }

      // Ordenamiento por defecto: por estado
      const aState = a.estado || '';
      const bState = b.estado || '';
      const statusA = statusOrder[aState as keyof typeof statusOrder] || 999;
      const statusB = statusOrder[bState as keyof typeof statusOrder] || 999;

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      // Si tienen el mismo estado, ordenar por ID de orden (convertir a string para comparación segura)
      const idA = a.id_pedido?.toString() || '';
      const idB = b.id_pedido?.toString() || '';

      // Ordenar alfabéticamente por ID (más reciente primero si son numéricos)
      return idB.localeCompare(idA);
    });

    console.log('Final filtered orders:', result.length);
    return result;
  }, [searchQuery, activeFilters.status, activeFilters.orderType, activeFilters._sort, orders]);

  // Calcular paginación
  const totalPages = Math.ceil((filteredOrders?.length || 0) / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Aplicar límite si se especifica, sino usar paginación
  const displayOrders = limit
    ? (filteredOrders || []).slice(0, limit)
    : (filteredOrders || []).slice(startIndex, endIndex);

  const handleSearch = useCallback((query: string) => {
    console.log('Searching for:', query);
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleFilter = useCallback((filters: Record<string, any>) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filterOptions = [
    {
      id: 'status',
      label: 'Estado',
      type: 'select' as const,
      options: ['Pendiente', 'Entregado', 'Finalizado', 'Cancelado']
    },
    {
      id: 'orderType',
      label: 'Tipo',
      type: 'select' as const,
      options: ['En Mesa', 'Para llevar']
    }
  ];

  // Generar páginas visibles para paginación
  const getVisiblePages = () => {
    const delta = 2;
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const rangeStart = Math.max(2, currentPage - delta);
      const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

      if (rangeStart > 2) {
        pages.push(-1);
      }

      for (let i = rangeStart; i <= rangeEnd; i++) {
        pages.push(i);
      }

      if (rangeEnd < totalPages - 1) {
        pages.push(-2);
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-1">
            {limit ? 'Ordenes recientes' : 'Gestión de ordenes'}
          </h2>
          <p className="text-muted-foreground">
            {limit ? 'Últimos ordenes registrados' : 'Administra y supervisa todas las órdenes'}
          </p>
        </div>

        <div className="flex gap-3 items-center">
          {!isOnline && <Badge variant="destructive">Sin conexión</Badge>}
          {isError && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-10"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Reintentar
            </Button>
          )}
          <Button
            onClick={() => navigate('/orders/new')}
            className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nueva orden
          </Button>
        </div>

      </div>

      {!limit && (
        <Card className="p-4">
          <SearchAndFilter
            search={searchQuery}
            onSearchChange={handleSearch}
            filters={filterOptions}
            onFilter={handleFilter}
            placeholder="Buscar por ID, cliente o mesa..."
          />
        </Card>
      )}

      {/* Mostrar error si existe */}
      {isError && (
        <ErrorDisplay
          error={error instanceof Error ? error : 'Error al cargar las ordenes'}
          onRetry={() => refetch()}
        />
      )}

      {/* Mostrar esqueleto durante la carga */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Mostrar cards cuando no hay error y no está cargando */}
      {!isLoading && !isError && (
        <>
          {!displayOrders || displayOrders.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                {searchQuery && searchQuery.trim()
                  ? `No se encontraron ordenes que coincidan con "${searchQuery}"`
                  : "No hay ordenes registrados aún."
                }
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {displayOrders.map((order) => (
                order && order.id_pedido ? (
                  <OrderCard key={order.id_pedido} order={order} />
                ) : null
              ))}
            </div>
          )}
        </>
      )}

      {/* Paginación solo si no hay límite y hay más de una página */}
      {!limit && totalPages > 1 && (
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredOrders?.length || 0)} de {filteredOrders?.length || 0} ordenes
            </div>
            <Pagination className="order-1 sm:order-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {getVisiblePages().map((page, i) => (
                  <PaginationItem key={page < 0 ? `ellipsis-${i}` : page}>
                    {page < 0 ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OrderList;
