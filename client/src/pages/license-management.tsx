import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { LicenseKey } from '../../../shared/schema';

interface GenerateLicenseFormData {
  planType: string;
  maxActivations: number;
  expiresAt?: string;
}

interface ActivateLicenseFormData {
  licenseKey: string;
}

const LicenseManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GenerateLicenseFormData>({
    planType: 'standard',
    maxActivations: 1,
  });
  const [activateForm, setActivateForm] = useState<ActivateLicenseFormData>({
    licenseKey: '',
  });

  // Fetch user's licenses
  const { data: licenses, isLoading, refetch } = useQuery<LicenseKey[]>({
    queryKey: ['/api/license/list'],
    onError: (err: any) => {
      setError('Failed to load licenses. Please try again.');
      console.error('License fetch error:', err);
    }
  });

  // Mutation for generating a new license
  const generateLicenseMutation = useMutation({
    mutationFn: async (data: GenerateLicenseFormData) => {
      return apiRequest('POST', '/api/license/generate', data);
    },
    onSuccess: () => {
      setSuccess('License generated successfully!');
      setShowForm(false);
      setFormData({
        planType: 'standard',
        maxActivations: 1,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/license/list'] });
    },
    onError: (err: any) => {
      setError('Failed to generate license. Please try again.');
      console.error('License generation error:', err);
    }
  });

  // Mutation for activating a license
  const activateLicenseMutation = useMutation({
    mutationFn: async (data: ActivateLicenseFormData) => {
      return apiRequest('POST', '/api/license/activate', data);
    },
    onSuccess: () => {
      setSuccess('License activated successfully!');
      setActivateForm({ licenseKey: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/license/list'] });
    },
    onError: (err: any) => {
      setError('Failed to activate license. Please try again.');
      console.error('License activation error:', err);
    }
  });

  // Mutation for deactivating a license
  const deactivateLicenseMutation = useMutation({
    mutationFn: async (licenseId: number) => {
      return apiRequest('POST', '/api/license/deactivate', { licenseId });
    },
    onSuccess: () => {
      setSuccess('License deactivated successfully!');
      queryClient.invalidateQueries({ queryKey: ['/api/license/list'] });
    },
    onError: (err: any) => {
      setError('Failed to deactivate license. Please try again.');
      console.error('License deactivation error:', err);
    }
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timeout = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [error, success]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'maxActivations' ? parseInt(value) : value,
    });
  };

  // Handle activate form input changes
  const handleActivateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setActivateForm({
      ...activateForm,
      [name]: value,
    });
  };

  // Handle form submission
  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateLicenseMutation.mutate(formData);
  };

  // Handle activate form submission
  const handleActivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    activateLicenseMutation.mutate(activateForm);
  };

  // Handle license deactivation
  const handleDeactivate = (licenseId: number) => {
    if (window.confirm('Are you sure you want to deactivate this license?')) {
      deactivateLicenseMutation.mutate(licenseId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          License Management
        </h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition"
          >
            {showForm ? 'Cancel' : 'Generate License'}
          </button>
          <button
            onClick={() => refetch()}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{success}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New License</h2>
          <form onSubmit={handleGenerateSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type
                </label>
                <select
                  name="planType"
                  value={formData.planType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Activations
                </label>
                <input
                  type="number"
                  name="maxActivations"
                  value={formData.maxActivations}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={generateLicenseMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
              >
                {generateLicenseMutation.isPending ? 'Generating...' : 'Generate License'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Activate License</h2>
        <form onSubmit={handleActivateSubmit}>
          <div className="flex space-x-4">
            <input
              type="text"
              name="licenseKey"
              value={activateForm.licenseKey}
              onChange={handleActivateInputChange}
              placeholder="Enter license key"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={activateLicenseMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {activateLicenseMutation.isPending ? 'Activating...' : 'Activate'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-6 border-b">Your Licenses</h2>
        
        {isLoading ? (
          <div className="p-6 text-center">Loading licenses...</div>
        ) : !licenses || licenses.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You don't have any licenses yet. Generate one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Key
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {licenses.map((license) => (
                  <tr key={license.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {license.licenseKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {license.planType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        license.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {license.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {license.activationsLeft} / {license.maxActivations}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {license.expiresAt
                        ? new Date(license.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeactivate(license.id)}
                        disabled={!license.isActive || deactivateLicenseMutation.isPending}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicenseManagement;