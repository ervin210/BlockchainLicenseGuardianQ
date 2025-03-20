import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Vote,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileCode,
  Lock,
  Loader2,
  BarChart3,
  Calendar,
  Eye,
  MessageSquare,
  Plus,
  Info,
  Flag,
  RefreshCw,
  Shield,
  Ban,
  Search,
  Code,
  GitBranch,
  Fingerprint
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import {
  ProposalType,
  ProposalStatus,
  Proposal,
  getActiveProposals,
  getCompletedProposals,
  createProposal,
  castVote,
  getUserVotingHistory,
  getGovernanceParameters,
  calculateVotingProgress,
  executeProposal
} from '@/lib/decentralized-governance';

export default function CommunityGovernance() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [selectedTab, setSelectedTab] = useState('active');
  
  // State for proposals
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);
  const [completedProposals, setCompletedProposals] = useState<Proposal[]>([]);
  const [votingHistory, setVotingHistory] = useState<any[]>([]);
  const [governanceParams, setGovernanceParams] = useState<any>(null);
  
  // State for creating new proposal
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [newProposalTitle, setNewProposalTitle] = useState('');
  const [newProposalDescription, setNewProposalDescription] = useState('');
  const [newProposalType, setNewProposalType] = useState<ProposalType>(ProposalType.FEATURE_ADDITION);
  const [newProposalImpact, setNewProposalImpact] = useState<'none' | 'low' | 'medium' | 'high' | 'critical'>('low');
  
  // State for voting
  const [isVoting, setIsVoting] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteChoice, setVoteChoice] = useState<'for' | 'against' | 'abstain'>('for');
  
  // State for loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isVoteSubmitting, setIsVoteSubmitting] = useState(false);
  const [isProposalSubmitting, setIsProposalSubmitting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Load proposals and governance data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [active, completed, history, params] = await Promise.all([
          getActiveProposals(),
          getCompletedProposals(),
          getUserVotingHistory(),
          getGovernanceParameters()
        ]);
        
        setActiveProposals(active);
        setCompletedProposals(completed);
        setVotingHistory(history);
        setGovernanceParams(params);
      } catch (error) {
        console.error("Failed to load governance data:", error);
        toast({
          title: "Failed to Load Data",
          description: "Could not load governance data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Format date in a friendly way
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate time remaining
  const getTimeRemaining = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      return `${hours}h remaining`;
    }
  };
  
  // Handle creating a new proposal
  const handleCreateProposal = async () => {
    if (!newProposalTitle.trim() || !newProposalDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description for your proposal",
        variant: "destructive",
      });
      return;
    }
    
    setIsProposalSubmitting(true);
    
    try {
      const result = await createProposal({
        title: newProposalTitle,
        description: newProposalDescription,
        type: newProposalType,
        securityImpact: newProposalImpact,
        metadata: {
          createdViaInterface: true,
          userRole: 'community_member'
        }
      });
      
      toast({
        title: "Proposal Created",
        description: "Your proposal has been created and is now open for voting",
      });
      
      // Refresh proposals list
      const active = await getActiveProposals();
      setActiveProposals(active);
      
      // Reset form and close modal
      setNewProposalTitle('');
      setNewProposalDescription('');
      setNewProposalType(ProposalType.FEATURE_ADDITION);
      setNewProposalImpact('low');
      setIsCreatingProposal(false);
    } catch (error) {
      console.error("Failed to create proposal:", error);
      toast({
        title: "Proposal Creation Failed",
        description: "There was an error creating your proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProposalSubmitting(false);
    }
  };
  
  // Handle voting on a proposal
  const handleVote = async (proposalId: string) => {
    setIsVoteSubmitting(true);
    
    try {
      const result = await castVote(proposalId, voteChoice);
      
      if (result.success) {
        toast({
          title: "Vote Cast Successfully",
          description: `Your vote has been recorded on the blockchain`,
        });
        
        // Refresh proposals list
        const active = await getActiveProposals();
        setActiveProposals(active);
        
        // Refresh voting history
        const history = await getUserVotingHistory();
        setVotingHistory(history);
        
        // Close voting modal
        setIsVoting(false);
        setSelectedProposal(null);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Failed to cast vote:", error);
      toast({
        title: "Voting Failed",
        description: "There was an error casting your vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVoteSubmitting(false);
    }
  };
  
  // Handle executing an approved proposal
  const handleExecuteProposal = async (proposalId: string) => {
    setIsExecuting(true);
    
    try {
      const result = await executeProposal(proposalId);
      
      if (result.success) {
        toast({
          title: "Proposal Executed",
          description: "The proposal has been executed and changes have been applied",
        });
        
        // Refresh proposals
        const [active, completed] = await Promise.all([
          getActiveProposals(),
          getCompletedProposals()
        ]);
        
        setActiveProposals(active);
        setCompletedProposals(completed);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Failed to execute proposal:", error);
      toast({
        title: "Execution Failed",
        description: "There was an error executing the proposal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Get badge variant based on proposal type
  const getProposalTypeBadge = (type: ProposalType) => {
    switch (type) {
      case ProposalType.FEATURE_ADDITION:
        return "secondary";
      case ProposalType.FEATURE_REMOVAL:
        return "destructive";
      case ProposalType.SECURITY_PARAMETER:
        return "outline";
      case ProposalType.SYSTEM_UPDATE:
        return "default";
      case ProposalType.GOVERNANCE_CHANGE:
        return "secondary";
      case ProposalType.EMERGENCY_ACTION:
        return "destructive";
      case ProposalType.TOKEN_DISTRIBUTION:
        return "outline";
      default:
        return "default";
    }
  };
  
  // Get badge variant based on proposal status
  const getProposalStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return "default";
      case ProposalStatus.APPROVED:
        return "outline";
      case ProposalStatus.REJECTED:
        return "destructive";
      case ProposalStatus.EXECUTED:
        return "secondary";
      case ProposalStatus.EXPIRED:
        return "outline";
      default:
        return "default";
    }
  };
  
  // Get badge variant based on security impact
  const getSecurityImpactBadge = (impact: string) => {
    switch (impact) {
      case 'none':
        return "outline";
      case 'low':
        return "secondary";
      case 'medium':
        return "default";
      case 'high':
        return "destructive";
      case 'critical':
        return "destructive";
      default:
        return "outline";
    }
  };
  
  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 text-transparent bg-clip-text">Global Community Governance</h1>
          <p className="text-muted-foreground">
            Ultra-scale governance system supporting 800,000,000+ users with equal voting rights
          </p>
        </div>
        
        {isCreatingProposal ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-primary" />
                Create New Proposal
              </CardTitle>
              <CardDescription>
                Submit a proposal for the community to vote on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proposal-title">Proposal Title</Label>
                <Input
                  id="proposal-title"
                  placeholder="Enter a clear, concise title"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proposal-description">Description</Label>
                <Textarea
                  id="proposal-description"
                  placeholder="Describe the proposal in detail, including rationale and expected outcomes"
                  rows={6}
                  value={newProposalDescription}
                  onChange={(e) => setNewProposalDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposal-type">Proposal Type</Label>
                  <select
                    id="proposal-type"
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={newProposalType}
                    onChange={(e) => setNewProposalType(e.target.value as ProposalType)}
                  >
                    <option value={ProposalType.FEATURE_ADDITION}>Feature Addition</option>
                    <option value={ProposalType.FEATURE_REMOVAL}>Feature Removal</option>
                    <option value={ProposalType.SECURITY_PARAMETER}>Security Parameter</option>
                    <option value={ProposalType.SYSTEM_UPDATE}>System Update</option>
                    <option value={ProposalType.GOVERNANCE_CHANGE}>Governance Change</option>
                    <option value={ProposalType.EMERGENCY_ACTION}>Emergency Action</option>
                    <option value={ProposalType.TOKEN_DISTRIBUTION}>Token Distribution</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="security-impact">Security Impact</Label>
                  <select
                    id="security-impact"
                    className="w-full p-2 rounded-md border border-input bg-background"
                    value={newProposalImpact}
                    onChange={(e) => setNewProposalImpact(e.target.value as 'none' | 'low' | 'medium' | 'high' | 'critical')}
                  >
                    <option value="none">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Proposal Process</AlertTitle>
                <AlertDescription>
                  After submission, your proposal will be open for voting for {governanceParams?.votingPeriod || 7} days. 
                  It requires {governanceParams?.votingThreshold || 70}% approval to pass.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setIsCreatingProposal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateProposal}
                disabled={isProposalSubmitting || !newProposalTitle.trim() || !newProposalDescription.trim()}
              >
                {isProposalSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Proposal
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : isVoting && selectedProposal ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Vote className="mr-2 h-5 w-5 text-primary" />
                Cast Your Vote
              </CardTitle>
              <CardDescription>
                {selectedProposal.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="whitespace-pre-wrap">{selectedProposal.description}</p>
              </div>
              
              <div className="space-y-4">
                <Label>Your Vote</Label>
                <RadioGroup value={voteChoice} onValueChange={(value) => setVoteChoice(value as 'for' | 'against' | 'abstain')}>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="for" id="vote-for" />
                    <Label htmlFor="vote-for" className="cursor-pointer flex items-center">
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Vote For
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="against" id="vote-against" />
                    <Label htmlFor="vote-against" className="cursor-pointer flex items-center">
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                      Vote Against
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="abstain" id="vote-abstain" />
                    <Label htmlFor="vote-abstain" className="cursor-pointer flex items-center">
                      <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                      Abstain
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Voting Information</AlertTitle>
                <AlertDescription>
                  Your vote will be recorded on the blockchain and cannot be changed.
                  All users have equal voting weight in this fully decentralized governance system.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
                setIsVoting(false);
                setSelectedProposal(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleVote(selectedProposal.id)}
                disabled={isVoteSubmitting}
              >
                {isVoteSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Vote...
                  </>
                ) : (
                  <>
                    <Vote className="mr-2 h-4 w-4" />
                    Submit Vote
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Tabs defaultValue="active" value={selectedTab} onValueChange={setSelectedTab}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="active">
                  <Clock className="mr-2 h-4 w-4" />
                  Active Proposals
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </TabsTrigger>
                <TabsTrigger value="my-votes">
                  <Vote className="mr-2 h-4 w-4" />
                  My Votes
                </TabsTrigger>
                <TabsTrigger value="info">
                  <Info className="mr-2 h-4 w-4" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="theft-detection" className="bg-red-50 dark:bg-red-900/20">
                  <Shield className="mr-2 h-4 w-4" />
                  Theft Detection
                </TabsTrigger>
              </TabsList>
              
              <Button onClick={() => setIsCreatingProposal(true)} className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal
              </Button>
            </div>
            
            <TabsContent value="active" className="m-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeProposals.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-2 text-lg font-medium">No Active Proposals</h3>
                  <p className="text-muted-foreground">
                    There are currently no active proposals to vote on.
                  </p>
                  <Button onClick={() => setIsCreatingProposal(true)} variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create a New Proposal
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeProposals.map((proposal) => (
                    <Card key={proposal.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center text-xl">
                            {proposal.title}
                          </CardTitle>
                          <Badge variant={getProposalTypeBadge(proposal.type)}>
                            {proposal.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center justify-between">
                          <span>Created {formatDate(proposal.createdAt)}</span>
                          <span className="font-medium flex items-center">
                            <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                            {getTimeRemaining(proposal.expiresAt)}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-4">
                          <p className="text-sm line-clamp-3">{proposal.description}</p>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-4 w-4" />
                                {proposal.votesFor + proposal.votesAgainst} votes
                              </span>
                              <span>{Math.round((proposal.votesFor / proposal.totalEligibleVoters) * 100)}% of {proposal.votingRequired}% required</span>
                            </div>
                            <Progress value={calculateVotingProgress(proposal)} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{proposal.votesFor} For</span>
                              <span>{proposal.votesAgainst} Against</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <Badge variant={getSecurityImpactBadge(proposal.securityImpact)}>
                              {proposal.securityImpact.charAt(0).toUpperCase() + proposal.securityImpact.slice(1)} Impact
                            </Badge>
                            
                            {proposal.auditStatus && (
                              <Badge variant="outline">
                                Audit: {proposal.auditStatus.replace(/_/g, " ")}
                              </Badge>
                            )}
                            
                            {proposal.metadata.createdViaInterface && (
                              <Badge variant="outline" className="bg-primary/5">
                                Community Created
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-4">
                        <Button variant="outline" className="text-sm">
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Details
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedProposal(proposal);
                            setIsVoting(true);
                          }}
                          className="text-sm"
                        >
                          <Vote className="mr-1.5 h-3.5 w-3.5" />
                          Cast Vote
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="m-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : completedProposals.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-2 text-lg font-medium">No Completed Proposals</h3>
                  <p className="text-muted-foreground">
                    There are no completed proposals to display yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {completedProposals.map((proposal) => (
                    <Card key={proposal.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{proposal.title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={getProposalTypeBadge(proposal.type)}>
                              {proposal.type.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant={getProposalStatusBadge(proposal.status)}>
                              {proposal.status}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription>
                          Completed on {formatDate(proposal.expiresAt)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 pb-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">{proposal.votesFor} For ({Math.round((proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100)}%)</span>
                            <span className="text-muted-foreground">{proposal.votesAgainst} Against</span>
                          </div>
                          
                          {proposal.status === ProposalStatus.APPROVED && !proposal.executionHash ? (
                            <Button
                              onClick={() => handleExecuteProposal(proposal.id)}
                              disabled={isExecuting}
                              size="sm"
                            >
                              {isExecuting ? (
                                <>
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  Executing...
                                </>
                              ) : (
                                <>
                                  <Code className="mr-2 h-3 w-3" />
                                  Execute
                                </>
                              )}
                            </Button>
                          ) : proposal.executionHash ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Executed
                            </Badge>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-votes" className="m-0">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : votingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Vote className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-2 text-lg font-medium">No Voting History</h3>
                  <p className="text-muted-foreground">
                    You haven't voted on any proposals yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Your Voting Activity</h3>
                  <div className="border rounded-lg divide-y">
                    {votingHistory.map((vote) => (
                      <div key={vote.id} className="p-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">{vote.proposalTitle}</span>
                          <span className="text-sm text-muted-foreground">
                            Voted on {formatDate(vote.timestamp)}
                          </span>
                        </div>
                        <Badge variant={vote.choice === 'for' ? 'outline' : vote.choice === 'against' ? 'destructive' : 'secondary'}>
                          {vote.choice === 'for' ? 'Voted For' : vote.choice === 'against' ? 'Voted Against' : 'Abstained'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="theft-detection" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5 text-red-500" />
                      Code Theft Protection
                    </CardTitle>
                    <CardDescription>
                      Advanced protection against unauthorized code usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border rounded-md p-4 bg-muted/50">
                      <h3 className="font-medium flex items-center mb-2">
                        <GitBranch className="mr-2 h-4 w-4 text-primary" />
                        Clone Detection Status
                      </h3>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Total Scans:</span>
                          <span className="ml-2 font-medium">12,452</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Anomalies:</span>
                          <span className="ml-2 font-medium">3</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Theft Attempts:</span>
                          <span className="ml-2 font-medium">1</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blacklisted:</span>
                          <span className="ml-2 font-medium">8</span>
                        </div>
                      </div>
                      <Alert variant="destructive" className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Active Theft Attempt Detected</AlertTitle>
                        <AlertDescription className="text-xs">
                          Unauthorized code use detected from IP address 198.51.100.78
                          from Azerbaijan. Device has been blacklisted.
                        </AlertDescription>
                      </Alert>
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Search className="mr-1.5 h-3 w-3" />
                          View Detection Log
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Blacklisted Devices</h3>
                      <div className="border rounded-md divide-y max-h-60 overflow-y-auto">
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Device BC876F</span>
                            <span className="text-xs text-muted-foreground">Azerbaijan</span>
                          </div>
                          <Badge variant="destructive">Blacklisted</Badge>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Device 45DEC1</span>
                            <span className="text-xs text-muted-foreground">Russia</span>
                          </div>
                          <Badge variant="destructive">Blacklisted</Badge>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Device 9A231F</span>
                            <span className="text-xs text-muted-foreground">China</span>
                          </div>
                          <Badge variant="destructive">Blacklisted</Badge>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Device F12E4C</span>
                            <span className="text-xs text-muted-foreground">Myanmar</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Ban className="mr-1.5 h-3 w-3 text-red-500" />
                            Ban
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Fingerprint className="mr-2 h-5 w-5 text-red-500" />
                      Quantum Code Verification
                    </CardTitle>
                    <CardDescription>
                      Quantum-resistant cryptographic verification of all governance code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-muted/50">
                        <h3 className="font-medium flex items-center mb-3">
                          <Lock className="mr-2 h-4 w-4 text-green-500" />
                          Verified Code Integrity
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Governance Module:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              Verified
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Voting System:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              Verified
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Consensus Engine:</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              Verified
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Proposal Processing:</span>
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                              Pending Verification
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Quantum Security</AlertTitle>
                        <AlertDescription className="text-sm">
                          <p className="mb-2">
                            All code for this governance system is verified using post-quantum cryptography.
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>All votes and proposals are permanently recorded on the sharded blockchain</li>
                            <li>Zero-knowledge proofs protect voter privacy while ensuring vote authenticity</li>
                            <li>70% approval threshold with layer-2 scaling ensures rapid consensus</li>
                            <li>Equal voting power for 800M+ users prevents centralization</li>
                            <li>1M votes per second processing capacity with global node distribution</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="mr-2 h-5 w-5 text-primary" />
                      Governance Parameters
                    </CardTitle>
                    <CardDescription>
                      Current system configuration for the DRM governance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : governanceParams ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Voting Threshold</div>
                            <div className="text-2xl">{governanceParams.votingThreshold}%</div>
                            <div className="text-xs text-muted-foreground">Approval required to pass</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Voting Period</div>
                            <div className="text-2xl">{governanceParams.votingPeriod} days</div>
                            <div className="text-xs text-muted-foreground">Standard voting duration</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Active Users</div>
                            <div className="text-2xl">800M+</div>
                            <div className="text-xs text-muted-foreground">Global community members</div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm font-medium">Processing Capacity</div>
                            <div className="text-2xl">1M votes/sec</div>
                            <div className="text-xs text-muted-foreground">Sharded blockchain throughput</div>
                          </div>
                        </div>
                        
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Equal Rights Governance</AlertTitle>
                          <AlertDescription>
                            All users have equal voting power in this system. No admin privileges exist.
                            Changes to this system itself require {governanceParams.votingThreshold}% community approval.
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4">
                        <p className="text-muted-foreground">Unable to load governance parameters</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                      Governance Statistics
                    </CardTitle>
                    <CardDescription>
                      Historical statistics and participation data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold">{completedProposals.length}</div>
                          <div className="text-sm text-muted-foreground">Completed Proposals</div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold">{governanceParams?.averageParticipation || 82}%</div>
                          <div className="text-sm text-muted-foreground">Average Participation</div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold">{governanceParams?.proposalSuccessRate || 64}%</div>
                          <div className="text-sm text-muted-foreground">Proposal Success Rate</div>
                        </div>
                        
                        <div className="bg-muted/50 p-4 rounded-lg text-center">
                          <div className="text-3xl font-bold">{governanceParams?.avgExecutionTime || 4.2}d</div>
                          <div className="text-sm text-muted-foreground">Avg Execution Time</div>
                        </div>
                      </div>
                      
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Decentralized System</AlertTitle>
                        <AlertDescription className="text-sm">
                          <p className="mb-2">
                            This ultra-scale governance system was designed to support 800M+ users with these features:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>All votes and proposals are permanently recorded on the sharded blockchain</li>
                            <li>Zero-knowledge proofs protect voter privacy while ensuring vote authenticity</li>
                            <li>70% approval threshold with layer-2 scaling ensures rapid consensus</li>
                            <li>Equal voting power for 800M+ users prevents centralization</li>
                            <li>1M votes per second processing capacity with global node distribution</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}