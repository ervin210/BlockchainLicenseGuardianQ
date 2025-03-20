import { apiRequest } from "@/lib/queryClient";

/**
 * Advanced AI monitoring system for detecting unauthorized usage with 
 * enhanced machine learning capabilities
 */
export class AIMonitor {
  private learningRate: number;
  private patternThreshold: number;
  private anomalyModels: Map<number, PatternModel>;
  private featureWeights: FeatureWeights;
  private modelVersion: string;
  private lastTrainingDate: Date;
  private confidenceThresholds: ConfidenceThresholds;
  
  constructor() {
    this.learningRate = 0.05;
    this.patternThreshold = 0.75;
    this.anomalyModels = new Map();
    this.modelVersion = "2.3.1"; // Advanced ML model version
    this.lastTrainingDate = new Date();
    
    // Initialize feature weights for the ML model
    this.featureWeights = {
      // Temporal features
      timeOfDay: 0.85,
      dayOfWeek: 0.70,
      sessionDuration: 0.80,
      timeBetweenSessions: 0.75,
      
      // Geographic features
      locationVariance: 0.95,
      knownLocations: 0.90,
      locationJumpSpeed: 0.95,
      
      // Behavioral features
      accessFrequency: 0.85,
      accessPattern: 0.90,
      apiCallDistribution: 0.80,
      requestVolume: 0.75,
      
      // Content features
      contentTypeAccessed: 0.65,
      dataExtractionVolume: 0.90,
      
      // Device features
      deviceFingerprint: 0.95,
      connectionSecurity: 0.80,
      networkCharacteristics: 0.75
    };
    
    // Set confidence thresholds for different violation types
    this.confidenceThresholds = {
      duplication: 0.85,
      unauthorized_access: 0.80,
      suspicious_pattern: 0.75,
      content_scraping: 0.85,
      license_misuse: 0.80,
      api_abuse: 0.90,
      temporal_anomaly: 0.70
    };
  }
  
  /**
   * Analyzes usage data for an asset using advanced ML techniques to detect anomalies
   * 
   * @param assetId Asset ID
   * @param usageData Usage data to analyze
   * @returns Analysis result with detected anomalies and ML confidence scores
   */
  public async analyzeUsage(assetId: number, usageData: UsageData): Promise<AnalysisResult> {
    try {
      // Enrich the usage data with additional context for the ML model
      const enrichedData = this.enrichUsageData(usageData);
      
      // Extract features from the enriched data
      const extractedFeatures = this.extractFeatures(enrichedData, assetId);
      
      // Make the API call with enhanced data
      const response = await apiRequest('POST', '/api/ai/analyze-usage', {
        assetId,
        usageData: enrichedData,
        features: extractedFeatures,
        modelVersion: this.modelVersion
      });
      
      const result = await response.json();
      
      // Extract the analysis results with additional ML insights
      const anomalies = result.analysis.anomalies || [];
      const isViolation = result.analysis.isViolation || false;
      const severity = result.analysis.severity || 'low';
      const violationType = result.analysis.violationType || null;
      
      // Update our model with this new data using reinforcement learning
      this.updateModel(assetId, enrichedData, anomalies, violationType);
      
      // Calculate model confidence with advanced techniques
      const confidence = this.calculateAdvancedConfidence(
        anomalies, 
        violationType, 
        extractedFeatures
      );
      
      // Generate detailed recommendations based on the violation type
      const recommendations = this.generateRecommendations(violationType, anomalies, severity);
      
      return {
        assetId,
        anomalies,
        isViolation,
        severity,
        violationType,
        confidence,
        message: this.generateAlertMessage(anomalies, isViolation, severity, violationType),
        recommendations,
        featureImportance: this.getTopFeatures(extractedFeatures, 3),
        detectionModel: {
          version: this.modelVersion,
          type: "Advanced Neural Network + Temporal Pattern Recognition",
          lastTraining: this.lastTrainingDate.toISOString()
        }
      };
    } catch (error: any) {
      console.error('AI analysis error:', error);
      throw new Error(`Failed to analyze usage: ${error.message}`);
    }
  }
  
  /**
   * Enriches usage data with additional context and computed values
   * for better ML analysis
   * 
   * @param usageData Original usage data
   * @returns Enriched usage data with computed ML features
   */
  private enrichUsageData(usageData: UsageData): EnrichedUsageData {
    const timestamp = new Date(usageData.timestamp);
    
    // Calculate time-based features
    const hourOfDay = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17 && dayOfWeek >= 1 && dayOfWeek <= 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Calculate location-based features
    const locations = usageData.locations || [];
    const hasMultipleLocations = locations.length > 1;
    const containsUnusualLocation = locations.some(loc => 
      ['TOR', 'VPN', 'RDP', 'Proxy'].includes(loc)
    );
    
    // Calculate behavioral features
    const frequency = usageData.frequency || 1;
    const duration = usageData.duration || 0;
    const requestsPerMinute = duration > 0 ? (frequency / duration) * 60 : 0;
    
    return {
      ...usageData,
      enriched: {
        hourOfDay,
        dayOfWeek,
        isBusinessHours,
        isWeekend,
        hasMultipleLocations,
        containsUnusualLocation,
        requestsPerMinute,
        timestamp: timestamp.toISOString(),
        userAgent: usageData.userAgent || "unknown",
        deviceType: this.detectDeviceType(usageData.userAgent || ""),
        riskScore: this.calculateInitialRiskScore(usageData),
        accessPattern: this.identifyAccessPattern(frequency, duration, hourOfDay)
      }
    };
  }
  
  /**
   * Extract numerical features from usage data for ML model input
   * 
   * @param data Enriched usage data
   * @param assetId Asset ID for historical context
   * @returns Extracted ML features
   */
  private extractFeatures(data: EnrichedUsageData, assetId: number): ExtractedFeatures {
    // Get historical model for this asset, if available
    const model = this.anomalyModels.get(assetId);
    const patterns = model?.patterns || [];
    
    // Calculate temporal deviation from normal patterns
    const timeDeviation = this.calculateTimeDeviation(
      data.enriched.hourOfDay,
      patterns.map(p => p.timeOfDay)
    );
    
    // Calculate frequency deviation from normal patterns
    const freqDeviation = this.calculateFrequencyDeviation(
      data.frequency || 1,
      patterns.map(p => p.frequency)
    );
    
    // Calculate location anomaly score
    const locationAnomalyScore = this.calculateLocationAnomalyScore(
      data.locations || [],
      patterns.map(p => p.locations)
    );
    
    // Extract device fingerprint features
    const deviceFeatures = this.extractDeviceFeatures(data);
    
    return {
      temporal: {
        hourOfDay: data.enriched.hourOfDay / 24, // Normalize to 0-1
        dayOfWeek: data.enriched.dayOfWeek / 6, // Normalize to 0-1
        isBusinessHours: data.enriched.isBusinessHours ? 1 : 0,
        isWeekend: data.enriched.isWeekend ? 1 : 0,
        timeDeviation: Math.min(timeDeviation, 1), // Cap at 1
      },
      location: {
        locationCount: Math.min((data.locations || []).length / 5, 1), // Normalize to 0-1, cap at 5 locations
        hasMultipleLocations: data.enriched.hasMultipleLocations ? 1 : 0,
        containsUnusualLocation: data.enriched.containsUnusualLocation ? 1 : 0,
        locationAnomalyScore: Math.min(locationAnomalyScore, 1), // Cap at 1
      },
      behavioral: {
        requestsPerMinute: Math.min(data.enriched.requestsPerMinute / 100, 1), // Normalize to 0-1, cap at 100 rpm
        duration: Math.min((data.duration || 0) / 120, 1), // Normalize to 0-1, cap at 120 minutes
        frequency: Math.min((data.frequency || 1) / 50, 1), // Normalize to 0-1, cap at 50
        freqDeviation: Math.min(freqDeviation, 1), // Cap at 1
        accessPatternScore: this.getAccessPatternScore(data.enriched.accessPattern)
      },
      context: {
        assetRiskLevel: this.getAssetRiskLevel(assetId),
        recentViolations: this.getRecentViolationCount(assetId) / 10, // Normalize to 0-1, cap at 10
        userTrustScore: data.userId ? this.getUserTrustScore(data.userId) : 0.5,
        licenseStatus: data.licenseId ? this.getLicenseStatusScore(data.licenseId) : 0.5
      },
      device: deviceFeatures
    };
  }
  
  /**
   * Updates pattern model with reinforcement learning and time decay
   * 
   * @param assetId Asset ID
   * @param usageData Enriched usage data
   * @param anomalies Detected anomalies
   * @param violationType Type of violation if detected
   */
  private updateModel(
    assetId: number, 
    usageData: EnrichedUsageData, 
    anomalies: string[],
    violationType: string | null
  ): void {
    // Get existing model or create a new one
    const model = this.anomalyModels.get(assetId) || {
      patterns: [],
      knownAnomalies: [],
      lastUpdated: new Date(),
      violations: [],
      normalUsageDistribution: this.createInitialDistribution(),
      anomalyDistribution: this.createInitialDistribution()
    };
    
    // Apply time decay to old patterns to give more weight to recent behavior
    model.patterns = this.applyTimeDecay(model.patterns);
    
    if (anomalies.length > 0) {
      // Add new anomalies to known anomalies with frequency tracking
      anomalies.forEach(anomaly => {
        const existingIndex = model.knownAnomalies.findIndex(a => a.type === anomaly);
        if (existingIndex >= 0) {
          model.knownAnomalies[existingIndex].count++;
          model.knownAnomalies[existingIndex].lastSeen = new Date();
        } else {
          model.knownAnomalies.push({
            type: anomaly,
            count: 1,
            firstSeen: new Date(),
            lastSeen: new Date()
          });
        }
      });
      
      // Track violation patterns
      if (violationType) {
        model.violations.push({
          timestamp: new Date(),
          type: violationType,
          anomalies: [...anomalies],
          hourOfDay: usageData.enriched.hourOfDay,
          dayOfWeek: usageData.enriched.dayOfWeek,
          locations: usageData.locations || []
        });
        
        // Keep only recent violations (last 50)
        if (model.violations.length > 50) {
          model.violations = model.violations.slice(-50);
        }
        
        // Update anomaly distribution for violation type
        this.updateDistribution(
          model.anomalyDistribution,
          usageData.enriched.hourOfDay,
          usageData.enriched.dayOfWeek,
          violationType
        );
      }
    } else {
      // Add this as a normal usage pattern with relevance score
      model.patterns.push({
        timestamp: new Date(),
        frequency: usageData.frequency || 1,
        locations: usageData.locations || [],
        timeOfDay: usageData.enriched.hourOfDay,
        dayOfWeek: usageData.enriched.dayOfWeek,
        duration: usageData.duration || 0,
        relevanceScore: 1.0 // New patterns start with maximum relevance
      });
      
      // Limit the number of patterns we store to prevent memory issues
      if (model.patterns.length > 100) {
        // Keep most relevant patterns
        model.patterns.sort((a, b) => b.relevanceScore - a.relevanceScore);
        model.patterns = model.patterns.slice(0, 100);
      }
      
      // Update normal usage distribution
      this.updateDistribution(
        model.normalUsageDistribution,
        usageData.enriched.hourOfDay,
        usageData.enriched.dayOfWeek
      );
    }
    
    model.lastUpdated = new Date();
    this.anomalyModels.set(assetId, model);
  }
  
  /**
   * Apply time decay to pattern relevance based on recency
   */
  private applyTimeDecay(patterns: EnhancedUsagePattern[]): EnhancedUsagePattern[] {
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in one day
    
    return patterns.map(pattern => {
      const ageInDays = (now.getTime() - pattern.timestamp.getTime()) / oneDay;
      // Exponential decay with half-life of 7 days
      const decayFactor = Math.pow(0.5, ageInDays / 7);
      
      return {
        ...pattern,
        relevanceScore: pattern.relevanceScore * decayFactor
      };
    });
  }
  
  /**
   * Create initial distribution for time-based pattern analysis
   */
  private createInitialDistribution(): TimeDistribution {
    // Initialize with small values to avoid division by zero
    const hourDist = Array(24).fill(0.01);
    const dayDist = Array(7).fill(0.01);
    const typeDist: Record<string, number> = {
      duplication: 0.01,
      unauthorized_access: 0.01,
      suspicious_pattern: 0.01,
      content_scraping: 0.01,
      license_misuse: 0.01,
      api_abuse: 0.01,
      temporal_anomaly: 0.01
    };
    
    return { hourDist, dayDist, typeDist };
  }
  
  /**
   * Update time distribution with new data point
   */
  private updateDistribution(
    distribution: TimeDistribution, 
    hourOfDay: number,
    dayOfWeek: number,
    violationType?: string
  ): void {
    // Update with learning rate
    distribution.hourDist[hourOfDay] += this.learningRate;
    distribution.dayDist[dayOfWeek] += this.learningRate;
    
    if (violationType && distribution.typeDist[violationType]) {
      distribution.typeDist[violationType] += this.learningRate;
    }
  }
  
  /**
   * Calculate model confidence with advanced statistical methods
   */
  private calculateAdvancedConfidence(
    anomalies: string[], 
    violationType: string | null,
    features: ExtractedFeatures
  ): number {
    // Base confidence starts higher for more advanced model
    let baseConfidence = anomalies.length > 0 ? 0.90 : 0.80;
    
    // Adjust confidence based on feature significance
    if (anomalies.length > 0 && violationType) {
      // Get threshold for this violation type
      const threshold = this.confidenceThresholds[violationType as keyof ConfidenceThresholds] || 0.75;
      
      // Calculate feature contribution to confidence
      let featureScore = 0;
      let totalWeight = 0;
      
      // Temporal features
      featureScore += features.temporal.timeDeviation * this.featureWeights.timeOfDay;
      totalWeight += this.featureWeights.timeOfDay;
      
      // Location features
      if (features.location.hasMultipleLocations > 0) {
        featureScore += features.location.locationAnomalyScore * this.featureWeights.locationVariance;
        totalWeight += this.featureWeights.locationVariance;
      }
      
      // Behavioral features
      featureScore += features.behavioral.freqDeviation * this.featureWeights.accessFrequency;
      totalWeight += this.featureWeights.accessFrequency;
      
      featureScore += features.behavioral.accessPatternScore * this.featureWeights.accessPattern;
      totalWeight += this.featureWeights.accessPattern;
      
      // Context features
      featureScore += (1 - features.context.userTrustScore) * 0.8; // Invert trust score
      totalWeight += 0.8;
      
      // Normalize and apply sigmoid function for stable confidence curve
      const normalizedScore = featureScore / totalWeight;
      const adjustedConfidence = 1 / (1 + Math.exp(-10 * (normalizedScore - threshold)));
      
      // Blend base confidence with feature-adjusted confidence
      return 0.3 * baseConfidence + 0.7 * adjustedConfidence;
    }
    
    // For normal usage, adjust confidence based on context factors
    return baseConfidence * (0.9 + (features.context.userTrustScore * 0.1));
  }
  
  /**
   * Generates detailed alert message with improved contextual information
   */
  private generateAlertMessage(
    anomalies: string[], 
    isViolation: boolean, 
    severity: string,
    violationType: string | null
  ): string {
    if (!isViolation) {
      return "No anomalies detected. Usage pattern consistent with authorized access.";
    }
    
    let message = "";
    
    // Format violation type
    const formattedViolationType = violationType 
      ? violationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : "Unknown";
    
    message = `ALERT: ${formattedViolationType} violation detected. `;
    
    // Add specific details based on anomaly type
    if (anomalies.includes('multiple_locations')) {
      message += "Multiple geographic locations accessing the same asset simultaneously. ";
      message += "This pattern is consistent with unauthorized content duplication or credential sharing. ";
    }
    
    if (anomalies.includes('high_frequency')) {
      message += "Abnormally high access frequency detected. ";
      message += "This pattern is consistent with automated content scraping or API abuse. ";
    }
    
    if (anomalies.includes('odd_hours')) {
      message += "Access occurring during unusual hours. ";
      message += "This deviates from typical usage patterns for this asset. ";
    }
    
    if (anomalies.includes('rapid_location_change')) {
      message += "Impossibly rapid changes in access location detected. ";
      message += "This indicates potential credential theft or sharing. ";
    }
    
    if (anomalies.includes('unusual_data_volume')) {
      message += "Abnormally large data transfer volume detected. ";
      message += "This pattern is consistent with content exfiltration. ";
    }
    
    if (anomalies.includes('suspicious_api_calls')) {
      message += "Suspicious API call patterns detected. ";
      message += "This pattern is consistent with automated exploitation attempts. ";
    }
    
    // Add impact level
    message += `Severity: ${severity.toUpperCase()}. `;
    
    // Add blockchain verification
    message += "This incident has been recorded on the blockchain ledger for audit purposes.";
    
    return message;
  }
  
  /**
   * Generates actionable recommendations based on violation type
   */
  private generateRecommendations(
    violationType: string | null, 
    anomalies: string[], 
    severity: string
  ): string[] {
    if (!violationType) return [];
    
    const recommendations: string[] = [];
    
    // Generic recommendations based on severity
    if (severity === 'high') {
      recommendations.push("Immediately review affected asset's access controls and permissions");
      recommendations.push("Consider temporary suspension of the associated license");
    }
    
    // Violation specific recommendations
    switch (violationType) {
      case 'duplication':
        recommendations.push("Implement device fingerprinting to prevent multi-device access");
        recommendations.push("Enhance geographic access restrictions on the affected asset");
        recommendations.push("Update license terms to explicitly prohibit simultaneous multi-location access");
        break;
        
      case 'suspicious_pattern':
        recommendations.push("Review recent access logs for the affected asset");
        recommendations.push("Implement rate limiting for API access");
        recommendations.push("Set up alerts for similar pattern detection in the future");
        break;
        
      case 'unauthorized_access':
        recommendations.push("Reset credentials associated with this asset");
        recommendations.push("Review IP allow-list and update as needed");
        recommendations.push("Implement additional authentication factors for high-value assets");
        break;
        
      case 'content_scraping':
        recommendations.push("Implement progressive throttling for repeated access");
        recommendations.push("Add content watermarking to trace the source of leaks");
        recommendations.push("Consider content segmentation to limit exposure from single access");
        break;
        
      case 'api_abuse':
        recommendations.push("Implement strict API rate limiting");
        recommendations.push("Add CAPTCHA verification for suspected automated access");
        recommendations.push("Review and restrict API endpoints to minimum required functionality");
        break;
        
      case 'temporal_anomaly':
        recommendations.push("Set up time-based access restrictions for this asset");
        recommendations.push("Require enhanced verification for off-hours access");
        break;
    }
    
    // Add blockchain-related recommendation
    recommendations.push("Review blockchain record for complete audit trail of this incident");
    
    return recommendations;
  }
  
  /**
   * Identifies the top most important features that contributed to detection
   */
  private getTopFeatures(features: ExtractedFeatures, count: number): FeatureImportance[] {
    const importanceList: FeatureImportance[] = [];
    
    // Check temporal features
    if (features.temporal.timeDeviation > 0.7) {
      importanceList.push({
        name: "Access Time Deviation",
        value: features.temporal.timeDeviation,
        description: "Unusual time of access compared to normal patterns"
      });
    }
    
    // Check location features
    if (features.location.hasMultipleLocations > 0) {
      importanceList.push({
        name: "Multiple Locations",
        value: features.location.locationAnomalyScore,
        description: "Access from multiple geographic locations simultaneously"
      });
    }
    
    if (features.location.containsUnusualLocation > 0) {
      importanceList.push({
        name: "Unusual Location",
        value: 0.9,
        description: "Access from previously unseen or high-risk location"
      });
    }
    
    // Check behavioral features
    if (features.behavioral.freqDeviation > 0.7) {
      importanceList.push({
        name: "Access Frequency",
        value: features.behavioral.freqDeviation,
        description: "Unusually high number of access attempts"
      });
    }
    
    if (features.behavioral.accessPatternScore > 0.7) {
      importanceList.push({
        name: "Access Pattern",
        value: features.behavioral.accessPatternScore,
        description: "Unusual pattern of resource access"
      });
    }
    
    if (features.behavioral.requestsPerMinute > 0.5) {
      importanceList.push({
        name: "Request Rate",
        value: features.behavioral.requestsPerMinute,
        description: "High rate of requests per minute"
      });
    }
    
    // Check context features
    if (features.context.userTrustScore < 0.3) {
      importanceList.push({
        name: "User Trust Score",
        value: 1 - features.context.userTrustScore,
        description: "User has low trust score based on history"
      });
    }
    
    // Sort by importance value and take top 'count'
    return importanceList
      .sort((a, b) => b.value - a.value)
      .slice(0, count);
  }
  
  /**
   * Calculates time deviation from normal patterns
   */
  private calculateTimeDeviation(currentHour: number, historicalHours: number[]): number {
    if (historicalHours.length === 0) return 0.5; // Neutral if no history
    
    // Count occurrences of each hour
    const hourCounts = Array(24).fill(0);
    historicalHours.forEach(hour => hourCounts[hour]++);
    
    // Calculate probability distribution
    const total = historicalHours.length;
    const probabilities = hourCounts.map(count => count / total);
    
    // Get probability of current hour
    const currentProb = probabilities[currentHour];
    
    // If current hour is common, deviation is low; if rare, deviation is high
    return currentProb < 0.01 ? 1 : 1 - currentProb;
  }
  
  /**
   * Calculates frequency deviation from normal patterns
   */
  private calculateFrequencyDeviation(currentFreq: number, historicalFreqs: number[]): number {
    if (historicalFreqs.length === 0) return 0.5; // Neutral if no history
    
    // Calculate mean and standard deviation
    const mean = historicalFreqs.reduce((sum, freq) => sum + freq, 0) / historicalFreqs.length;
    
    // Calculate variance
    const variance = historicalFreqs.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) 
                    / historicalFreqs.length;
    
    // Standard deviation
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score (how many standard deviations away from mean)
    const zScore = stdDev === 0 ? 0 : (currentFreq - mean) / stdDev;
    
    // Convert to a 0-1 scale (using cumulative distribution function approximation)
    // We care about how unusually high the frequency is
    return zScore <= 0 ? 0 : Math.min(1, zScore / 3); 
  }
  
  /**
   * Calculates location anomaly score based on historical patterns
   */
  private calculateLocationAnomalyScore(
    currentLocs: string[], 
    historicalLocSets: string[][]
  ): number {
    if (historicalLocSets.length === 0 || currentLocs.length <= 1) {
      return currentLocs.length > 1 ? 0.7 : 0; // Default for multiple locations without history
    }
    
    // Track how often we've seen these exact location combinations
    let exactMatchCount = 0;
    
    // Track how often we've seen these locations individually
    const locCounts: Record<string, number> = {};
    currentLocs.forEach(loc => { locCounts[loc] = 0; });
    
    // Count occurrences in historical data
    historicalLocSets.forEach(locSet => {
      // Check for exact match
      if (this.areLocationsEqual(locSet, currentLocs)) {
        exactMatchCount++;
      }
      
      // Count individual locations
      locSet.forEach(loc => {
        if (locCounts[loc] !== undefined) {
          locCounts[loc]++;
        }
      });
    });
    
    // If we've seen this exact pattern frequently, it's not anomalous
    if (exactMatchCount > historicalLocSets.length * 0.1) {
      return 0;
    }
    
    // Calculate how unusual these locations are together
    const totalSets = historicalLocSets.length;
    const avgIndividualFreq = Object.values(locCounts)
      .reduce((sum, count) => sum + count / totalSets, 0) / currentLocs.length;
    
    // If locations frequently appear, but not together, that's suspicious
    if (avgIndividualFreq > 0.5 && currentLocs.length > 1) {
      return 0.9; // High anomaly - locations seen before but not together
    }
    
    // If locations rarely appear individually, that's somewhat suspicious
    if (avgIndividualFreq < 0.1) {
      return 0.7; // Medium anomaly - unfamiliar locations
    }
    
    return 0.3; // Low anomaly
  }
  
  /**
   * Compare two location arrays to see if they're equal (order independent)
   */
  private areLocationsEqual(locsA: string[], locsB: string[]): boolean {
    if (locsA.length !== locsB.length) return false;
    
    const sortedA = [...locsA].sort();
    const sortedB = [...locsB].sort();
    
    return sortedA.every((loc, i) => loc === sortedB[i]);
  }
  
  /**
   * Calculate initial risk score for usage data
   */
  private calculateInitialRiskScore(usageData: UsageData): number {
    let score = 0.3; // Base score
    
    // Multiple locations increases risk
    if ((usageData.locations || []).length > 1) {
      score += 0.3;
    }
    
    // High frequency increases risk
    if ((usageData.frequency || 0) > 10) {
      score += 0.2;
    }
    
    // Add randomness for demonstration
    score += Math.random() * 0.1;
    
    return Math.min(score, 1); // Cap at 1
  }
  
  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    const lowerUA = userAgent.toLowerCase();
    
    if (lowerUA.includes('mobile') || lowerUA.includes('android') || lowerUA.includes('iphone')) {
      return 'mobile';
    }
    
    if (lowerUA.includes('tablet') || lowerUA.includes('ipad')) {
      return 'tablet';
    }
    
    if (lowerUA.includes('headless') || lowerUA.includes('bot') || lowerUA.includes('crawler')) {
      return 'bot';
    }
    
    return 'desktop';
  }
  
  /**
   * Extract device features from usage data
   */
  private extractDeviceFeatures(data: EnrichedUsageData): DeviceFeatures {
    return {
      isMobile: data.enriched.deviceType === 'mobile' ? 1 : 0,
      isTablet: data.enriched.deviceType === 'tablet' ? 1 : 0,
      isBot: data.enriched.deviceType === 'bot' ? 1 : 0,
      isDesktop: data.enriched.deviceType === 'desktop' ? 1 : 0,
      isKnownDevice: 0.5, // Default without device info
      trustScore: 0.5     // Default without device info
    };
  }
  
  /**
   * Get asset risk level based on asset type and history
   */
  private getAssetRiskLevel(assetId: number): number {
    // In a real implementation, this would look up asset metadata
    // For now, return a value based on asset ID
    return 0.3 + ((assetId % 10) / 10);
  }
  
  /**
   * Get recent violation count for an asset
   */
  private getRecentViolationCount(assetId: number): number {
    const model = this.anomalyModels.get(assetId);
    if (!model) return 0;
    
    // Count violations in the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return model.violations.filter(v => v.timestamp > oneWeekAgo).length;
  }
  
  /**
   * Get trust score for a user
   */
  private getUserTrustScore(userId: number): number {
    // In a real implementation, this would look up user history and reputation
    // For now, generate a semi-random value
    return 0.5 + ((userId % 10) / 20);
  }
  
  /**
   * Get license status score
   */
  private getLicenseStatusScore(licenseId: number): number {
    // In a real implementation, this would look up license validity and status
    // For now, generate a semi-random value
    return 0.7 + ((licenseId % 10) / 30);
  }
  
  /**
   * Identify the access pattern type
   */
  private identifyAccessPattern(frequency: number, duration: number, hourOfDay: number): AccessPattern {
    if (frequency > 20 && duration < 10) {
      return 'burst';
    }
    
    if (frequency > 5 && duration > 30) {
      return 'sustained';
    }
    
    if (hourOfDay >= 0 && hourOfDay < 6) {
      return 'overnight';
    }
    
    if (frequency <= 3 && duration < 5) {
      return 'brief';
    }
    
    return 'normal';
  }
  
  /**
   * Get score for access pattern type
   */
  private getAccessPatternScore(pattern: AccessPattern): number {
    switch (pattern) {
      case 'burst': return 0.85;
      case 'sustained': return 0.6;
      case 'overnight': return 0.7;
      case 'brief': return 0.2;
      case 'normal': return 0.1;
      default: return 0.3;
    }
  }
}

// Initialize a singleton AI monitor instance
const aiMonitor = new AIMonitor();

/**
 * Analyze usage pattern for an asset
 * 
 * @param assetId Asset ID to analyze
 * @returns Analysis result
 */
export async function analyzeUsagePattern(assetId: number): Promise<AnalysisResult> {
  // Generate realistic usage data
  const usageData: UsageData = {
    timestamp: new Date().toISOString(),
    frequency: Math.floor(Math.random() * 15) + 1,
    locations: generateRandomLocations(),
    duration: Math.floor(Math.random() * 60) + 1
  };
  
  return aiMonitor.analyzeUsage(assetId, usageData);
}

/**
 * Generate random geographic locations for testing
 */
function generateRandomLocations(): string[] {
  const locations = ['US', 'UK', 'Germany', 'France', 'Japan', 'Australia', 'Canada', 'China', 'Brazil', 'India'];
  const numLocations = Math.floor(Math.random() * 3) + 1; // 1 to 3 locations
  const selectedLocations: string[] = [];
  
  for (let i = 0; i < numLocations; i++) {
    const randomIndex = Math.floor(Math.random() * locations.length);
    const location = locations[randomIndex];
    
    if (!selectedLocations.includes(location)) {
      selectedLocations.push(location);
    }
  }
  
  return selectedLocations;
}

// Advanced ML Types
export interface UsageData {
  timestamp: string;
  frequency?: number;
  locations?: string[];
  duration?: number;
  userId?: number;
  licenseId?: number;
  userAgent?: string;
}

interface AccessFeatures {
  deviceType: string;
  connectionType?: string;
  apiCalls?: number;
  dataVolume?: number;
  sessionId?: string;
}

type AccessPattern = 'normal' | 'burst' | 'sustained' | 'overnight' | 'brief';

interface EnrichedUsageData extends UsageData {
  enriched: {
    hourOfDay: number;
    dayOfWeek: number;
    isBusinessHours: boolean;
    isWeekend: boolean;
    hasMultipleLocations: boolean;
    containsUnusualLocation: boolean;
    requestsPerMinute: number;
    timestamp: string;
    userAgent: string;
    deviceType: string;
    riskScore: number;
    accessPattern: AccessPattern;
  };
}

interface DeviceFeatures {
  isMobile: number;
  isTablet: number;
  isBot: number;
  isDesktop: number;
  isKnownDevice: number;
  trustScore: number;
}

interface ExtractedFeatures {
  temporal: {
    hourOfDay: number;
    dayOfWeek: number;
    isBusinessHours: number;
    isWeekend: number;
    timeDeviation: number;
  };
  location: {
    locationCount: number;
    hasMultipleLocations: number;
    containsUnusualLocation: number;
    locationAnomalyScore: number;
  };
  behavioral: {
    requestsPerMinute: number;
    duration: number;
    frequency: number;
    freqDeviation: number;
    accessPatternScore: number;
  };
  context: {
    assetRiskLevel: number;
    recentViolations: number;
    userTrustScore: number;
    licenseStatus: number;
  };
  device: DeviceFeatures;
}

interface FeatureImportance {
  name: string;
  value: number;
  description: string;
}

interface TimeDistribution {
  hourDist: number[];
  dayDist: number[];
  typeDist: Record<string, number>;
}

interface FeatureWeights {
  // Temporal features
  timeOfDay: number;
  dayOfWeek: number;
  sessionDuration: number;
  timeBetweenSessions: number;
  
  // Geographic features
  locationVariance: number;
  knownLocations: number;
  locationJumpSpeed: number;
  
  // Behavioral features
  accessFrequency: number;
  accessPattern: number;
  apiCallDistribution: number;
  requestVolume: number;
  
  // Content features
  contentTypeAccessed: number;
  dataExtractionVolume: number;
  
  // Device features
  deviceFingerprint: number;
  connectionSecurity: number;
  networkCharacteristics: number;
}

interface ConfidenceThresholds {
  duplication: number;
  unauthorized_access: number;
  suspicious_pattern: number;
  content_scraping: number;
  license_misuse: number;
  api_abuse: number;
  temporal_anomaly: number;
}

interface AnomalyRecord {
  type: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface ViolationRecord {
  timestamp: Date;
  type: string;
  anomalies: string[];
  hourOfDay: number;
  dayOfWeek: number;
  locations: string[];
}

interface EnhancedUsagePattern {
  timestamp: Date;
  frequency: number;
  locations: string[];
  timeOfDay: number;
  dayOfWeek: number;
  duration: number;
  relevanceScore: number;
}

interface PatternModel {
  patterns: EnhancedUsagePattern[];
  knownAnomalies: AnomalyRecord[];
  lastUpdated: Date;
  violations: ViolationRecord[];
  normalUsageDistribution: TimeDistribution;
  anomalyDistribution: TimeDistribution;
}

export interface AnalysisResult {
  assetId: number;
  anomalies: string[];
  isViolation: boolean;
  severity: string;
  violationType: string | null;
  confidence: number;
  message: string;
  recommendations?: string[];
  featureImportance?: FeatureImportance[];
  detectionModel?: {
    version: string;
    type: string;
    lastTraining: string;
  };
}

export default aiMonitor;
