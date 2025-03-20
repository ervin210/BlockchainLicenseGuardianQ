import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AccessControl() {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for new user
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    role: "user",
  });

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    queryFn: async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      } catch (error) {
        // If the API endpoint isn't implemented yet, return mock data
        console.error("Error fetching users:", error);
        toast({
          title: "API Not Implemented",
          description: "The users API endpoint is not implemented yet. Using simulated data.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Filter users based on search term
  const filteredUsers = users?.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      try {
        const response = await apiRequest('POST', '/api/users', userData);
        return response.json();
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error('Failed to create user');
      }
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "The user has been successfully created",
      });
      setIsAddUserDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update user role mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      try {
        const response = await apiRequest('PATCH', `/api/users/${userId}`, { role });
        return response.json();
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error('Failed to update user role');
      }
    },
    onSuccess: () => {
      toast({
        title: "Role Updated",
        description: "The user role has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update role: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        await apiRequest('DELETE', `/api/users/${userId}`, {});
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error('Failed to delete user');
      }
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      name: "",
      role: "user",
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(formData);
  };

  const handleUpdateRole = (userId: number, newRole: string) => {
    updateUserRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">Access Control</h2>
          <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specific access permissions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter user's full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user accounts and their access permissions in the system.
            </CardDescription>
            <div className="relative mt-4">
              <Input
                type="text"
                placeholder="Search users..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-4 border rounded">
                    <div className="w-1/4">
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    </div>
                    <div className="w-1/4">
                      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                    </div>
                    <div className="w-1/4">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="w-1/4 flex justify-end">
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.username}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m5-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try a different search term" : "Add a new user to get started"}
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsAddUserDialogOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New User
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}