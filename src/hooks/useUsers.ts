import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { userService } from '@/services/userService';
import { CreateUserDto, UpdateUserDto, User } from '@/types/user';

export function useUsers() {
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  const createUserMutation = useMutation({
    mutationFn: (userData: CreateUserDto) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear usuario",
        description: error.message || "Ha ocurrido un error al crear el usuario",
        variant: "destructive",
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserDto }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar usuario",
        description: error.message || "Ha ocurrido un error al actualizar el usuario",
        variant: "destructive",
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al eliminar usuario",
        description: error.message || "Ha ocurrido un error al eliminar el usuario",
        variant: "destructive",
      });
    }
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (id: number) => userService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar estado",
        description: error.message || "Ha ocurrido un error al actualizar el estado del usuario",
        variant: "destructive",
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) => 
      userService.resetUserPassword(id, newPassword),
    onSuccess: () => {
      toast({
        title: "Contraseña actualizada",
        description: "La contraseña del usuario ha sido actualizada exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al actualizar contraseña",
        description: error.message || "Ha ocurrido un error al actualizar la contraseña",
        variant: "destructive",
      });
    }
  });

  return {
    users,
    isLoading,
    error,
    refetch,
    createUser: createUserMutation.mutate,
    isCreating: createUserMutation.isPending,
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isPending,
    deleteUser: deleteUserMutation.mutate,
    isDeleting: deleteUserMutation.isPending,
    toggleUserStatus: toggleUserStatusMutation.mutate,
    isTogglingStatus: toggleUserStatusMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}

export function useUser(id?: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id!),
    enabled: !!id,
  });
}
