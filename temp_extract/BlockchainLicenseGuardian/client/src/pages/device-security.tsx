import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Lock, AlertTriangle, CheckCircle, X, Fingerprint, Laptop, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
  browserInfo: string;
  operatingSystem: string;
  lastSeen?: string;
  isCurrentDevice: boolean;
}

export default function DeviceSecurity() {
  const [currentDevice, setCurrentDevice] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [userId, setUserId] = useState<number | null>(null);
  const { toast } = useToast();

  // Generate device fingerprint
  const generateFingerprint = () => {
    const userAgent = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const fingerprint = btoa(`${userAgent}|${screenInfo}|${timeZone}|${language}|${Date.now()}`);
    return fingerprint;
  };

  // Get current device information
  const getCurrentDeviceInfo = () => {
    const fingerprint = generateFingerprint();
    const userAgent = navigator.userAgent;
    
    // Extract browser and OS information from user agent
    let browserInfo = "Unknown Browser";
    let operatingSystem = "Unknown OS";
    
    if (userAgent.indexOf("Firefox") > -1) {
      browserInfo = "Firefox";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserInfo = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserInfo = "Safari";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserInfo = "Edge";
    }
    
    if (userAgent.indexOf("Windows") > -1) {
      operatingSystem = "Windows";
    } else if (userAgent.indexOf("Mac") > -1) {
      operatingSystem = "MacOS";
    } else if (userAgent.indexOf("Linux") > -1) {
      operatingSystem = "Linux";
    } else if (userAgent.indexOf("Android") > -1) {
      operatingSystem = "Android";
    } else if (userAgent.indexOf("iPhone") > -1 || userAgent.indexOf("iPad") > -1) {
      operatingSystem = "iOS";
    }
    
    return {
      fingerprint,
      deviceName: `${operatingSystem} - ${browserInfo}`,
      browserInfo,
      operatingSystem,
      lastSeen: new Date().toISOString(),
      isCurrentDevice: true
    };
  };

  // Get user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        // Get user info from auth endpoint
        const userResponse = await apiRequest('GET', '/api/auth/user');
        const userData = await userResponse.json();
        
        if (userData) {
          setUserId(userData.id || userData.sub);
          
          // Get current device info
          const deviceInfo = getCurrentDeviceInfo();
          setCurrentDevice(deviceInfo);
          
          // Get device count
          const devicesResponse = await apiRequest('GET', '/api/devices');
          const devicesData = await devicesResponse.json();
          
          if (Array.isArray(devicesData)) {
            setDeviceCount(devicesData.length);
          }
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('Failed to load security information. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);

  // Function to activate maximum security
  const activateMaximumSecurity = async () => {
    if (!currentDevice || !userId) {
      toast({
        title: "Error",
        description: "Device information is not available. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setActivating(true);
      setError(null);
      
      // Call API to lock account to this device
      const response = await apiRequest('POST', '/api/security/lock-to-device', {
        userId,
        currentDeviceId: currentDevice.fingerprint.substring(0, 20),
        currentFingerprint: currentDevice.fingerprint
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(true);
        toast({
          title: "Maximum Security Activated",
          description: "Your account is now protected. Only this device can access your account.",
          variant: "default"
        });
      } else {
        throw new Error(result.message || 'Failed to activate security');
      }
    } catch (err: any) {
      console.error('Error activating security:', err);
      setError(err.message || 'An unexpected error occurred while activating security');
      toast({
        title: "Security Activation Failed",
        description: err.message || 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-2">
        <Shield className="h-8 w-8 text-primary" />
        Enhanced Security Protection
      </h1>
      
      <div className="mb-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>SECURITY ALERT</AlertTitle>
          <AlertDescription>
            Protect your account from unauthorized access and remote connections. Lock your account to this device only.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Laptop className="h-5 w-5 text-primary" />
                Current Device
              </CardTitle>
              <CardDescription>This is the device you are currently using</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : currentDevice ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Device ID:</span>
                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {currentDevice.fingerprint.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Device:</span>
                    <span className="text-sm text-muted-foreground">{currentDevice.operatingSystem}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Browser:</span>
                    <span className="text-sm text-muted-foreground">{currentDevice.browserInfo}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Device information not available
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-destructive/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Security Threats
              </CardTitle>
              <CardDescription>Detected potential security issues</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>Your account can be accessed from multiple devices</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>Remote console access is currently not blocked</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>Background processes can make changes without your knowledge</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>Unauthorized assistant access is possible</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Activate Maximum Security Protection
            </CardTitle>
            <CardDescription>
              Lock your account to this device only and prevent unauthorized access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Single Device Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Your account will be locked to this device only
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Block Remote Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Prevents remote connections to your account
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Block Console Access</h4>
                  <p className="text-sm text-muted-foreground">
                    Prevents unauthorized console manipulation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Quantum Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Enables advanced protection against unauthorized changes
                  </p>
                </div>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <X className="h-5 w-5" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="bg-primary/10 border-primary/30">
                <CheckCircle className="h-5 w-5 text-primary" />
                <AlertTitle>Security Activated</AlertTitle>
                <AlertDescription>
                  Your account is now locked to this device only. All other devices have been blocked.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {deviceCount > 0 && !success ? (
                <span>
                  <strong>{deviceCount}</strong> device(s) will be blocked
                </span>
              ) : success ? (
                <span className="text-primary font-medium">
                  Your account is protected
                </span>
              ) : null}
            </div>
            <Button 
              onClick={activateMaximumSecurity} 
              disabled={loading || activating || success}
              size="lg"
              className="gap-2"
            >
              {activating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Activating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Protection Active
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Activate Protection
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}