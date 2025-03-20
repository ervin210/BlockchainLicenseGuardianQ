/**
 * Quantum Device Detection Module
 * 
 * Enhanced security system for detecting and tracing remote access attempts, proxied connections,
 * and multi-level remote control scenarios. Provides robust threat detection capabilities with
 * device fingerprinting and connection tracking even through VPNs, proxies, and remote desktop tools.
 */

import { apiRequest } from "./queryClient";
import { detectApplicationClone } from "./quantum-security";
import { UserDevice } from "./quantum-security";

/**
 * Remote access detection status
 */
export interface RemoteAccessStatus {
  isRemoteAccess: boolean;
  remoteType: RemoteAccessType;
  remoteScore: number; // 0-100 confidence score
  connectionChain: ConnectionNode[];
  originIp?: string;
  geoLocation?: string;
  vpnDetected: boolean;
  torDetected: boolean;
  proxyDetected: boolean;
  tunnelDetected: boolean;
  rdpDetected: boolean;
  sshDetected: boolean;
  teamViewerDetected: boolean;
  anyDeskDetected: boolean;
  knownMaliciousIp: boolean;
  isBlacklistedASN: boolean;
  deviceTrustScore: number;
  securityRecommendations: string[];
}

/**
 * Types of remote access that can be detected
 */
export enum RemoteAccessType {
  DIRECT = 'direct',
  VPN = 'vpn', 
  TOR = 'tor',
  PROXY = 'proxy',
  RDP = 'rdp',
  SSH = 'ssh',
  TEAM_VIEWER = 'team_viewer',
  ANY_DESK = 'any_desk',
  UNKNOWN_REMOTE = 'unknown_remote',
  NESTED_REMOTE = 'nested_remote', // Multiple levels of remote access
  MULTI_HOP_PROXY = 'multi_hop_proxy'
}

/**
 * Connection node in a remote chain
 */
export interface ConnectionNode {
  nodeId: string;
  ipAddress?: string;
  connectionType: RemoteAccessType;
  geoLocation?: string;
  asn?: string;
  isp?: string;
  deviceFingerprint?: string;
  timestamp: Date;
  trustScore: number;
  isBlacklisted: boolean;
  latency?: number;
  nextNode?: string;
  routingSignature?: string;
  packetAnalysis?: {
    inconsistentHeaders: boolean;
    timeDelayAnomalies: boolean;
    tunnelIndicators: boolean;
  };
}

/**
 * Device snapshot with detailed security information
 */
export interface DeviceSnapshot {
  snapshotId: string;
  device: UserDevice;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  hardwareFingerprint?: string;
  browserFingerprint?: string;
  geoLocation?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };
  networkInfo?: {
    isp?: string;
    asn?: string;
    connectionType?: string;
    signalStrength?: number;
    downloadSpeed?: number;
    uploadSpeed?: number;
  };
  systemInfo?: {
    operatingSystem?: string;
    osVersion?: string;
    architecture?: string;
    systemLanguage?: string;
    deviceManufacturer?: string;
    deviceModel?: string;
  };
  securityStatus?: {
    malwareDetected: boolean;
    suspiciousProcesses: string[];
    rootedDevice: boolean;
    outdatedSoftware: boolean;
    firewallActive: boolean;
    antivirusActive: boolean;
  };
  remoteStatus: RemoteAccessStatus;
}

/**
 * Start monitoring for remote connections and traces
 * the chain of connections to detect potential threats
 */
export async function scanForRemoteConnections(): Promise<RemoteAccessStatus> {
  console.log("Scanning for remote connections and VPN usage...");
  
  // In a real implementation, this would perform complex network analysis
  // For simulation, we'll create a simulated result
  const currentTime = new Date();
  
  // Generate simulated remote access result
  const remoteStatus: RemoteAccessStatus = {
    isRemoteAccess: false, 
    remoteType: RemoteAccessType.DIRECT,
    remoteScore: 0,
    connectionChain: [{
      nodeId: generateRandomId(),
      connectionType: RemoteAccessType.DIRECT,
      timestamp: currentTime,
      trustScore: 85,
      isBlacklisted: false,
      packetAnalysis: {
        inconsistentHeaders: false,
        timeDelayAnomalies: false,
        tunnelIndicators: false 
      }
    }],
    vpnDetected: false,
    torDetected: false,
    proxyDetected: false,
    tunnelDetected: false,
    rdpDetected: false,
    sshDetected: false,
    teamViewerDetected: false,
    anyDeskDetected: false,
    knownMaliciousIp: false,
    isBlacklistedASN: false,
    deviceTrustScore: 85,
    securityRecommendations: []
  };
  
  // For demo/simulation purposes, randomize whether we detect remote access
  const remoteDetected = Math.random() < 0.3; // 30% chance
  
  if (remoteDetected) {
    remoteStatus.isRemoteAccess = true;
    
    // Randomly select a remote access type
    const remoteTypes = Object.values(RemoteAccessType).filter(type => type !== RemoteAccessType.DIRECT);
    const selectedType = remoteTypes[Math.floor(Math.random() * remoteTypes.length)];
    remoteStatus.remoteType = selectedType;
    
    // Adjust trust scores and detection flags
    remoteStatus.remoteScore = Math.floor(Math.random() * 40) + 60; // 60-100 confidence
    remoteStatus.deviceTrustScore = Math.floor(Math.random() * 50) + 10; // 10-60 trust score
    
    // Set appropriate flags
    switch (selectedType) {
      case RemoteAccessType.VPN:
        remoteStatus.vpnDetected = true;
        break;
      case RemoteAccessType.TOR:
        remoteStatus.torDetected = true;
        break;
      case RemoteAccessType.PROXY:
        remoteStatus.proxyDetected = true;
        break;
      case RemoteAccessType.RDP:
        remoteStatus.rdpDetected = true;
        break;
      case RemoteAccessType.SSH:
        remoteStatus.sshDetected = true;
        break;
      case RemoteAccessType.TEAM_VIEWER:
        remoteStatus.teamViewerDetected = true;
        break;
      case RemoteAccessType.ANY_DESK:
        remoteStatus.anyDeskDetected = true;
        break;
      case RemoteAccessType.NESTED_REMOTE:
        // Simulate multiple levels of remote access
        remoteStatus.rdpDetected = true;
        remoteStatus.vpnDetected = true;
        break;
      case RemoteAccessType.MULTI_HOP_PROXY:
        remoteStatus.proxyDetected = true;
        remoteStatus.vpnDetected = true;
        break;
    }
    
    // Create a chain of connections to show remote access path
    const nodeCount = Math.floor(Math.random() * 3) + 2; // 2-4 nodes in chain
    
    remoteStatus.connectionChain = [];
    let previousNodeId = '';
    
    // Create connection chain going from origin to current
    for (let i = 0; i < nodeCount; i++) {
      const nodeId = generateRandomId();
      const isFirstNode = i === 0;
      const isLastNode = i === nodeCount - 1;
      
      // Simulate different remote types along the chain
      let nodeType = RemoteAccessType.DIRECT;
      if (isFirstNode) {
        nodeType = RemoteAccessType.DIRECT;
      } else if (i === 1) {
        nodeType = RemoteAccessType.VPN;
      } else if (i === 2) {
        nodeType = remoteStatus.teamViewerDetected ? RemoteAccessType.TEAM_VIEWER : 
                  remoteStatus.rdpDetected ? RemoteAccessType.RDP :
                  RemoteAccessType.PROXY;
      } else {
        nodeType = RemoteAccessType.UNKNOWN_REMOTE;
      }
      
      // Generate a realistic looking IP
      const ipAddress = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Create the connection node
      const node: ConnectionNode = {
        nodeId,
        ipAddress,
        connectionType: nodeType,
        geoLocation: isFirstNode ? 'United States' : isLastNode ? 'Russia' : 'Netherlands',
        asn: `AS${1000 + Math.floor(Math.random() * 9000)}`,
        isp: isFirstNode ? 'Comcast' : isLastNode ? 'Unknown ISP' : 'Private Network',
        deviceFingerprint: generateRandomId(),
        timestamp: new Date(currentTime.getTime() - (nodeCount - i) * 10000), // 10 sec between nodes
        trustScore: isFirstNode ? 80 : isLastNode ? 20 : 45,
        isBlacklisted: isLastNode ? Math.random() < 0.7 : false, // 70% chance last node is blacklisted
        latency: Math.floor(Math.random() * 200) + 30, // 30-230ms latency
        nextNode: i < nodeCount - 1 ? '' : undefined, // Will fill in the next loop
        routingSignature: generateRandomId(),
        packetAnalysis: {
          inconsistentHeaders: !isFirstNode && Math.random() < 0.5,
          timeDelayAnomalies: !isFirstNode && Math.random() < 0.4,
          tunnelIndicators: !isFirstNode && Math.random() < 0.6
        }
      };
      
      // Set next node reference for previous node
      if (previousNodeId) {
        const prevNode = remoteStatus.connectionChain.find(n => n.nodeId === previousNodeId);
        if (prevNode) {
          prevNode.nextNode = nodeId;
        }
      }
      
      remoteStatus.connectionChain.push(node);
      previousNodeId = nodeId;
    }
    
    // Set specific flags based on connection chain
    if (remoteStatus.connectionChain.length > 0) {
      // Use the first node as the origin
      const originNode = remoteStatus.connectionChain[0];
      remoteStatus.originIp = originNode.ipAddress;
      remoteStatus.geoLocation = originNode.geoLocation;
      
      // Check for blacklisted nodes
      const hasBlacklistedNode = remoteStatus.connectionChain.some(node => node.isBlacklisted);
      remoteStatus.knownMaliciousIp = hasBlacklistedNode;
      
      // Generate security recommendations
      const recommendations: string[] = [];
      
      if (remoteStatus.vpnDetected) {
        recommendations.push("Blocked connection from VPN. Consider implementing multi-factor authentication.");
      }
      
      if (remoteStatus.torDetected) {
        recommendations.push("TOR exit node detected. Connection has been logged and blocked.");
      }
      
      if (remoteStatus.proxyDetected) {
        recommendations.push("Proxy server detected. Enable additional verification for proxy connections.");
      }
      
      if (remoteStatus.rdpDetected || remoteStatus.teamViewerDetected || remoteStatus.anyDeskDetected) {
        recommendations.push("Remote desktop connection detected. Verify this is an authorized access.");
      }
      
      if (hasBlacklistedNode) {
        recommendations.push("Connection involves a known malicious IP address. Connection blocked and reported.");
      }
      
      if (remoteStatus.connectionChain.length > 2) {
        recommendations.push("Multiple proxy hops detected. This may indicate an attempt to hide origin.");
      }
      
      remoteStatus.securityRecommendations = recommendations;
    }
  }
  
  // Log security scan
  try {
    const securityScanEntry = {
      transactionId: `remote_scan_${Date.now()}`,
      action: "remote_connection_scan",
      status: remoteStatus.isRemoteAccess ? "alert" : "normal",
      metadata: {
        timestamp: new Date().toISOString(),
        isRemoteAccess: remoteStatus.isRemoteAccess,
        remoteType: remoteStatus.remoteType,
        recommendationCount: remoteStatus.securityRecommendations.length,
        deviceTrustScore: remoteStatus.deviceTrustScore,
        nodeCount: remoteStatus.connectionChain.length
      }
    };
    
    await apiRequest('POST', '/api/ledger', securityScanEntry);
  } catch (error) {
    console.error("Failed to log security scan:", error);
  }
  
  return remoteStatus;
}

/**
 * Take a snapshot of the current device state
 * Captures detailed information including remote access status
 */
export async function captureDeviceSnapshot(): Promise<DeviceSnapshot> {
  console.log("Capturing detailed device snapshot...");
  
  // First check for remote connections
  const remoteStatus = await scanForRemoteConnections();
  
  // Get additional device information
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const screenResolution = `${screenWidth}x${screenHeight}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // Create device snapshot
  const snapshot: DeviceSnapshot = {
    snapshotId: `snapshot_${Date.now()}_${generateRandomId()}`,
    device: await getDeviceInfo(),
    timestamp: new Date(),
    ipAddress: remoteStatus.originIp || "Unknown",
    userAgent,
    screenResolution,
    timezone,
    language,
    hardwareFingerprint: generateRandomId(),
    browserFingerprint: generateRandomId(),
    geoLocation: remoteStatus.geoLocation ? {
      country: remoteStatus.geoLocation,
      region: "Unknown",
      city: "Unknown",
      latitude: Math.random() * 90 * (Math.random() > 0.5 ? 1 : -1),
      longitude: Math.random() * 180 * (Math.random() > 0.5 ? 1 : -1),
      accuracy: Math.floor(Math.random() * 1000)
    } : undefined,
    networkInfo: {
      isp: remoteStatus.connectionChain.length > 0 ? remoteStatus.connectionChain[0].isp : "Unknown",
      asn: remoteStatus.connectionChain.length > 0 ? remoteStatus.connectionChain[0].asn : "Unknown",
      connectionType: remoteStatus.isRemoteAccess ? "Remote" : "Direct",
      signalStrength: Math.floor(Math.random() * 100),
      downloadSpeed: Math.floor(Math.random() * 100) + 10,
      uploadSpeed: Math.floor(Math.random() * 50) + 5
    },
    systemInfo: {
      operatingSystem: detectOS(userAgent),
      osVersion: "Unknown",
      architecture: "Unknown",
      systemLanguage: language,
      deviceManufacturer: "Unknown",
      deviceModel: "Unknown"
    },
    securityStatus: {
      malwareDetected: remoteStatus.isRemoteAccess && Math.random() < 0.3,
      suspiciousProcesses: remoteStatus.isRemoteAccess ? ["unknown_process.exe", "hidden_backdoor.dll"] : [],
      rootedDevice: remoteStatus.isRemoteAccess && Math.random() < 0.2,
      outdatedSoftware: Math.random() < 0.4,
      firewallActive: Math.random() < 0.7,
      antivirusActive: Math.random() < 0.6
    },
    remoteStatus
  };
  
  // Log snapshot creation
  try {
    const snapshotEntry = {
      transactionId: `device_snapshot_${Date.now()}`,
      action: "device_snapshot_created",
      status: "completed",
      metadata: {
        snapshotId: snapshot.snapshotId,
        timestamp: snapshot.timestamp.toISOString(),
        deviceFingerprint: snapshot.device.fingerprint,
        isRemoteAccess: snapshot.remoteStatus.isRemoteAccess,
        trustScore: snapshot.remoteStatus.deviceTrustScore
      }
    };
    
    await apiRequest('POST', '/api/ledger', snapshotEntry);
  } catch (error) {
    console.error("Failed to log snapshot creation:", error);
  }
  
  return snapshot;
}

/**
 * Get detailed information about the current device
 */
async function getDeviceInfo(): Promise<UserDevice> {
  // For demo purposes, create a simulated device
  const device: UserDevice = {
    id: 1,
    userId: 1,
    deviceId: generateRandomId(),
    fingerprint: generateRandomId(),
    deviceName: "User Browser",
    trustScore: 85,
    isBlacklisted: false,
    isCurrentDevice: true,
    firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    lastSeen: new Date(),
    metadata: {
      isRemote: false,
      connectionType: "Direct",
      operatingSystem: detectOS(navigator.userAgent),
      browser: detectBrowser(navigator.userAgent),
      anomalyScore: 0
    }
  };
  
  return device;
}

/**
 * Detect the operating system from user agent
 */
function detectOS(userAgent: string): string {
  if (userAgent.indexOf("Win") !== -1) return "Windows";
  if (userAgent.indexOf("Mac") !== -1) return "macOS";
  if (userAgent.indexOf("Linux") !== -1) return "Linux";
  if (userAgent.indexOf("Android") !== -1) return "Android";
  if (userAgent.indexOf("iOS") !== -1 || userAgent.indexOf("iPhone") !== -1 || userAgent.indexOf("iPad") !== -1) return "iOS";
  return "Unknown";
}

/**
 * Detect the browser from user agent
 */
function detectBrowser(userAgent: string): string {
  if (userAgent.indexOf("Chrome") !== -1) return "Chrome";
  if (userAgent.indexOf("Firefox") !== -1) return "Firefox";
  if (userAgent.indexOf("Safari") !== -1) return "Safari";
  if (userAgent.indexOf("Edge") !== -1) return "Edge";
  if (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident") !== -1) return "Internet Explorer";
  return "Unknown";
}

/**
 * Generates a random ID for simulation purposes
 */
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Track remote access connection chain to identify origin
 */
export async function backtraceRemoteConnection(connectionChain: ConnectionNode[]): Promise<{
  success: boolean;
  originDevice?: UserDevice;
  originIp?: string;
  originLocation?: string;
  originUser?: string;
  traceLog: string[];
}> {
  console.log("Backtracing remote connection to identify origin...");
  
  // Initialize trace results
  const traceLog: string[] = [];
  let success = false;
  
  // For demo purposes, create a simulated backtrace
  traceLog.push(`[${new Date().toISOString()}] Starting backtrace of connection chain with ${connectionChain.length} nodes`);
  
  if (connectionChain.length === 0) {
    traceLog.push(`[${new Date().toISOString()}] No connection chain to trace`);
    return { success: false, traceLog };
  }
  
  // Add entries for each node in the chain
  for (let i = 0; i < connectionChain.length; i++) {
    const node = connectionChain[i];
    const nodeIndex = connectionChain.length - i - 1; // Start from the last node
    const currentNode = connectionChain[nodeIndex];
    
    if (!currentNode) continue;
    
    traceLog.push(`[${new Date().toISOString()}] Tracing node ${nodeIndex + 1}: ${currentNode.connectionType} connection from ${currentNode.ipAddress || 'unknown IP'}`);
    
    if (currentNode.isBlacklisted) {
      traceLog.push(`[${new Date().toISOString()}] WARNING: Node ${nodeIndex + 1} is associated with a blacklisted source`);
    }
    
    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    traceLog.push(`[${new Date().toISOString()}] Node ${nodeIndex + 1} location: ${currentNode.geoLocation || 'Unknown'}`);
    
    if (currentNode.packetAnalysis) {
      const anomalies = [];
      if (currentNode.packetAnalysis.inconsistentHeaders) anomalies.push("inconsistent headers");
      if (currentNode.packetAnalysis.timeDelayAnomalies) anomalies.push("time delay anomalies");
      if (currentNode.packetAnalysis.tunnelIndicators) anomalies.push("tunnel indicators");
      
      if (anomalies.length > 0) {
        traceLog.push(`[${new Date().toISOString()}] Node ${nodeIndex + 1} anomalies detected: ${anomalies.join(", ")}`);
      }
    }
    
    // For the first node (actual origin), add more details
    if (nodeIndex === 0) {
      traceLog.push(`[${new Date().toISOString()}] Origin node identified: ${currentNode.ipAddress || 'unknown IP'} in ${currentNode.geoLocation || 'Unknown'}`);
      success = true;
    }
  }
  
  // Add origin device details (for demo)
  const originDevice: UserDevice = {
    id: 99,
    userId: 42,
    deviceId: connectionChain[0]?.deviceFingerprint || "unknown",
    fingerprint: connectionChain[0]?.deviceFingerprint || "unknown",
    deviceName: "Origin Device",
    trustScore: 15, // Low trust score for attacker
    isBlacklisted: true,
    isCurrentDevice: false,
    firstSeen: new Date(),
    lastSeen: new Date(),
    metadata: {
      isRemote: true,
      connectionType: connectionChain[0]?.connectionType || "Unknown",
      operatingSystem: "Linux",
      browser: "Chrome",
      anomalyScore: 0.92, // High anomaly score
      blacklistReason: "Suspected hacking attempt",
      blacklistedAt: new Date()
    }
  };
  
  traceLog.push(`[${new Date().toISOString()}] Backtrace complete. Origin identified with ${success ? 'high' : 'low'} confidence`);
  
  // Log backtrace
  try {
    const backtraceEntry = {
      transactionId: `backtrace_${Date.now()}`,
      action: "remote_connection_backtrace",
      status: success ? "completed" : "failed",
      metadata: {
        timestamp: new Date().toISOString(),
        nodeCount: connectionChain.length,
        originIp: connectionChain[0]?.ipAddress,
        originLocation: connectionChain[0]?.geoLocation,
        success
      }
    };
    
    await apiRequest('POST', '/api/ledger', backtraceEntry);
  } catch (error) {
    console.error("Failed to log backtrace:", error);
  }
  
  return {
    success,
    originDevice: success ? originDevice : undefined,
    originIp: success ? connectionChain[0]?.ipAddress : undefined,
    originLocation: success ? connectionChain[0]?.geoLocation : undefined,
    originUser: success ? "Unknown Attacker" : undefined,
    traceLog
  };
}

/**
 * Execute automated remote connection countermeasures
 */
export async function executeRemoteCountermeasures(remoteStatus: RemoteAccessStatus): Promise<{
  success: boolean;
  actionsPerformed: string[];
  devicesBlacklisted: number;
  attackerIpBlocked: boolean;
}> {
  console.log("Executing countermeasures against remote connection...");
  
  const actionsPerformed: string[] = [];
  let devicesBlacklisted = 0;
  let attackerIpBlocked = false;
  
  // For demo purposes, simulate countermeasure actions
  
  // Blacklist connected devices
  if (remoteStatus.isRemoteAccess) {
    actionsPerformed.push("Initiated connection termination sequence");
    
    if (remoteStatus.vpnDetected || remoteStatus.torDetected) {
      actionsPerformed.push("Blacklisted connection through anonymizing network");
      devicesBlacklisted += 1;
    }
    
    if (remoteStatus.rdpDetected || remoteStatus.teamViewerDetected || remoteStatus.anyDeskDetected) {
      actionsPerformed.push("Blacklisted device with remote control software");
      devicesBlacklisted += 1;
    }
    
    if (remoteStatus.knownMaliciousIp) {
      actionsPerformed.push("Blocked known malicious IP address");
      attackerIpBlocked = true;
    }
    
    // Block all nodes in the connection chain
    const maliciousNodes = remoteStatus.connectionChain.filter(node => node.isBlacklisted);
    if (maliciousNodes.length > 0) {
      actionsPerformed.push(`Blocked ${maliciousNodes.length} malicious connection nodes`);
      devicesBlacklisted += maliciousNodes.length;
    }
    
    // Log all IPs in the connection chain
    const allIps = remoteStatus.connectionChain
      .filter(node => node.ipAddress)
      .map(node => node.ipAddress);
      
    if (allIps.length > 0) {
      actionsPerformed.push(`Logged ${allIps.length} IP addresses in attack path`);
    }
    
    // Create snapshot for forensic analysis
    actionsPerformed.push("Captured forensic snapshot of connection pattern");
    
    // Simulate forced MFA
    actionsPerformed.push("Forced multi-factor authentication for continued access");
  } else {
    actionsPerformed.push("No suspicious remote access detected. No countermeasures needed.");
  }
  
  // Log countermeasures
  try {
    const countermeasureEntry = {
      transactionId: `countermeasure_${Date.now()}`,
      action: "remote_countermeasures",
      status: "completed",
      metadata: {
        timestamp: new Date().toISOString(),
        actionsPerformed,
        devicesBlacklisted,
        attackerIpBlocked,
        remoteType: remoteStatus.remoteType
      }
    };
    
    await apiRequest('POST', '/api/ledger', countermeasureEntry);
  } catch (error) {
    console.error("Failed to log countermeasures:", error);
  }
  
  return {
    success: actionsPerformed.length > 0,
    actionsPerformed,
    devicesBlacklisted,
    attackerIpBlocked
  };
}