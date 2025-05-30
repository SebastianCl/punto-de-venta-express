
import ClientList from '@/components/ClientList';

const Clients = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona la información de tus clientes e historial de facturación.
        </p>
      </div>
      <ClientList />
    </div>
  );
};

export default Clients;
