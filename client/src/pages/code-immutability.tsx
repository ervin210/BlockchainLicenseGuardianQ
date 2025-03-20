import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types for file integrity
interface FileIntegrity {
  id: number;
  filePath: string;
  fileHash: string;
  lastModified: string;
  size: number;
  status: 'valid' | 'modified' | 'deleted';
  blockchainTxId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface IntegrityReport {
  count: number;
  files: FileIntegrity[];
  error?: string;
}

function CodeImmutabilityPage() {
  const [activeTab, setActiveTab] = useState<'scan' | 'deleted' | 'modified'>('scan');
  const queryClient = useQueryClient();

  // Query for deleted files
  const deletedFilesQuery = useQuery<{ message: string; report: IntegrityReport }>({
    queryKey: ['/api/integrity/deleted'],
    enabled: activeTab === 'deleted',
  });

  // Query for modified files
  const modifiedFilesQuery = useQuery<{ message: string; report: IntegrityReport }>({
    queryKey: ['/api/integrity/modified'],
    enabled: activeTab === 'modified',
  });

  // Mutation for scanning files
  interface ScanResponse {
    message: string;
    result: {
      success: boolean;
    };
  }
  
  const scanMutation = useMutation<ScanResponse>({
    mutationFn: () => apiRequest('POST', '/api/integrity/scan').then(res => res.json()),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/integrity/deleted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/integrity/modified'] });
      // Run verification after scan
      verifyMutation.mutate();
    },
  });

  // Mutation for verifying files
  interface VerifyResponse {
    message: string;
    result: {
      totalFiles: number;
      missingFiles: any[];
      modifiedFiles: any[];
    };
  }
  
  const verifyMutation = useMutation<VerifyResponse>({
    mutationFn: () => apiRequest('GET', '/api/integrity/verify').then(res => res.json()),
  });

  // Function to handle scanning
  const handleScan = () => {
    scanMutation.mutate();
  };

  // Function to handle verification
  const handleVerify = () => {
    verifyMutation.mutate();
  };

  // Get the appropriate data based on active tab
  const getActiveData = () => {
    switch (activeTab) {
      case 'deleted':
        return deletedFilesQuery.data?.report as IntegrityReport;
      case 'modified':
        return modifiedFilesQuery.data?.report as IntegrityReport;
      default:
        return null;
    }
  };

  const activeData = getActiveData();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
          Quantum Code Immutability Protection
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Secure your code with blockchain-based immutability verification. Detect unauthorized 
          modifications or deletions with quantum-resistant cryptographic hashing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">File Integrity Scanner</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Scan your codebase to register file hashes and detect unauthorized modifications
            or deletions.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={handleScan}
              disabled={scanMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-200"
            >
              {scanMutation.isPending ? 'Scanning...' : 'Scan Files'}
            </button>
            <button
              onClick={handleVerify}
              disabled={verifyMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md transition duration-200"
            >
              {verifyMutation.isPending ? 'Verifying...' : 'Verify Integrity'}
            </button>
          </div>

          {scanMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
              <p>Scan completed successfully!</p>
            </div>
          )}

          {verifyMutation.isSuccess && (
            <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md">
              <p>Verification completed successfully!</p>
              {verifyMutation.data?.result && (
                <div className="mt-2">
                  <p>Total files: {verifyMutation.data.result.totalFiles}</p>
                  <p>Missing files: {verifyMutation.data.result.missingFiles.length}</p>
                  <p>Modified files: {verifyMutation.data.result.modifiedFiles.length}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Blockchain Immutability</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Store file hashes on the blockchain for immutable verification and 
            tamper-proof evidence of code integrity.
          </p>
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-md">
            <p className="font-medium">Important Security Notice</p>
            <p className="text-sm mt-1">
              Code immutability is a critical security feature. Any unauthorized 
              modifications to your code will be detected and permanently recorded.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'scan' 
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('scan')}
          >
            File Scanner
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'deleted' 
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-b-2 border-red-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('deleted')}
          >
            Deleted Files
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'modified' 
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-b-2 border-yellow-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('modified')}
          >
            Modified Files
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'scan' && (
            <div className="text-center p-8">
              <h3 className="text-xl font-medium mb-2">File Integrity Scanner</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Click the buttons above to scan and verify your codebase integrity.
              </p>
              {(scanMutation.isPending || verifyMutation.isPending) && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'deleted' || activeTab === 'modified') && (
            <>
              {deletedFilesQuery.isLoading || modifiedFilesQuery.isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : activeData && activeData.count > 0 ? (
                <div>
                  <h3 className="text-xl font-medium mb-4">
                    {activeTab === 'deleted' ? 'Deleted Files' : 'Modified Files'} 
                    ({activeData.count})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            File Path
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Last Modified
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Size
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {activeData.files.map((file) => (
                          <tr key={file.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {file.filePath}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${file.status === 'deleted' 
                                  ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                }
                              `}>
                                {file.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {new Date(file.lastModified).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {file.size} bytes
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-gray-600 dark:text-gray-300">
                    No {activeTab === 'deleted' ? 'deleted' : 'modified'} files detected.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 Ervin Remus Radosavlevici. All rights reserved.</p>
        <p>Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.</p>
      </div>
    </div>
  );
}

export default CodeImmutabilityPage;