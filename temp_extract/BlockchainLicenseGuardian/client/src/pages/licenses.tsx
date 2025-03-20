import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { License, Asset, InsertLicense } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

export default function Licenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: licenses, isLoading: isLoadingLicenses } = useQuery<License[]>({
    queryKey: ['/api/licenses', statusFilter],
    queryFn: async ({ queryKey }) => {
      const [_, status] = queryKey;
      const url = status ? `/api/licenses?status=${status}` : '/api/licenses';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true
  });

  // Filter licenses based on search term
  const filteredLicenses = licenses?.filter(license => {
    const licenseeText = license.metadata && (license.metadata as any).licensee 
      ? (license.metadata as any).licensee.toLowerCase() 
      : '';
    
    return (
      license.licenseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      licenseeText.includes(searchTerm.toLowerCase())
    );
  });

  // Function to download license certificate
  const downloadLicense = (license: License) => {
    try {
      // Create license certificate content
      const asset = assets?.find(a => a.id === license.assetId);
      const licensee = license.metadata && (license.metadata as any).licensee ? (license.metadata as any).licensee : 'Unknown User';
      const expiryDate = license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'No Expiration';
      
      const certificateContent = `
DIGITAL RIGHTS MANAGEMENT CERTIFICATE
===================================

LICENSE CODE: ${license.licenseCode}
ISSUED TO: ${licensee}
ASSET: ${asset?.name || `Asset #${license.assetId}`}
STATUS: ${license.status.toUpperCase()}
ISSUE DATE: ${new Date(license.issuedAt || new Date()).toLocaleDateString()}
EXPIRY DATE: ${expiryDate}
BLOCKCHAIN VERIFICATION: ${(license.metadata as any)?.verificationHash || 'Pending verification'}

This license is governed by the terms and conditions of the Digital Rights
Management System. Unauthorized reproduction or distribution is prohibited.

© ${new Date().getFullYear()} DRM Security System
`.trim();

      // Create blob and download
      const blob = new Blob([certificateContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `license-${license.licenseCode}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "License Downloaded",
        description: "The license certificate has been saved to your device.",
      });
    } catch (error) {
      console.error("Error downloading license:", error);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the license certificate.",
        variant: "destructive",
      });
    }
  };

  // Form schema for creating a new license
  const licenseFormSchema = z.object({
    licenseCode: z.string().min(5, "License code must be at least 5 characters"),
    assetId: z.string().min(1, "Please select an asset"),
    userId: z.string().default("1"), // Default to admin user in this example
    status: z.string().min(1, "Please select a status"),
    expiresInDays: z.string().optional(),
    licensee: z.string().min(1, "Licensee name is required"),
  });

  // Set up form
  const form = useForm<z.infer<typeof licenseFormSchema>>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseCode: `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      userId: "1",
      status: "active",
      licensee: "",
    },
  });

  // Mutation for creating a new license
  const createLicenseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof licenseFormSchema>) => {
      const { expiresInDays, licensee, ...licenseData } = data;
      
      // Calculate expiry date if provided
      let expiresAt: Date | null | undefined = undefined;
      if (expiresInDays && parseInt(expiresInDays) > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(expiresInDays));
        expiresAt = date;
      }
      
      // Create metadata object with licensee
      const metadata = { licensee };
      
      // Prepare license data for API
      const apiData: Partial<InsertLicense> = {
        ...licenseData,
        assetId: parseInt(licenseData.assetId),
        userId: parseInt(licenseData.userId),
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
        metadata,
      };
      
      const response = await apiRequest('POST', '/api/licenses', apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      toast({
        title: "License Created",
        description: "The license has been successfully created",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create license: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof licenseFormSchema>) => {
    createLicenseMutation.mutate(data);
  };

  // Helper function to format expiry date
  const formatExpiry = (license: License) => {
    if (!license.expiresAt) return "No expiration";
    
    const now = new Date();
    const expiryDate = new Date(license.expiresAt);
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return "Expires today";
    } else if (diffDays === 1) {
      return "Expires tomorrow";
    } else {
      return `Expires in ${diffDays} days`;
    }
  };

  return (
    <>
      <header className="bg-white shadow">
        <div className="flex justify-between items-center px-6 py-4">
          <h2 className="text-xl font-semibold text-neutral-dark">License Management</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Issue New License
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Issue New License</DialogTitle>
                <DialogDescription>
                  Create a new license for a digital asset. Fill in the details below.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="licenseCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., L-2023-123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assets?.map(asset => (
                              <SelectItem key={asset.id} value={asset.id.toString()}>
                                {asset.name}
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
                    name="licensee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Licensee</FormLabel>
                        <FormControl>
                          <Input placeholder="Company or individual name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="expiring">Expiring</SelectItem>
                            <SelectItem value="revoked">Revoked</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expiresInDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expires In (days)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Leave empty for no expiration" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" disabled={createLicenseMutation.isPending}>
                      {createLicenseMutation.isPending ? "Creating..." : "Create License"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between mb-6">
              <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
                <Input 
                  type="text" 
                  placeholder="Search licenses..." 
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
              <Tabs 
                defaultValue="all" 
                onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="expiring">Expiring</TabsTrigger>
                  <TabsTrigger value="revoked">Revoked</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoadingLicenses ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between mb-2">
                      <div className="w-1/2">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-200 rounded w-24"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredLicenses && filteredLicenses.length > 0 ? (
              <div className="space-y-4">
                {filteredLicenses.map(license => (
                  <Card key={license.id} className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{license.licenseCode}</h3>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {license.metadata && (license.metadata as any).licensee ? 
                              (license.metadata as any).licensee : 'Unknown User'}
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Asset ID: {license.assetId}
                          </span>
                          <span className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatExpiry(license)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          license.status === 'active' ? 'bg-green-100 text-green-800' : 
                          license.status === 'expiring' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
                        </span>
                        <Button variant="ghost" size="sm" className="ml-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => downloadLicense(license)}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No licenses found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try a different search term" : "Issue a new license to get started"}
                </p>
                <div className="mt-6">
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Issue New License
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
