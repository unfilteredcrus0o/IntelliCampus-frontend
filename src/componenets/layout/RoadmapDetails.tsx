import React, { useEffect, useState, useMemo } from "react";
import {
  Typography,
  CircularProgress,
  Box,
  List,
  ListItem,
  LinearProgress,
  Drawer,
  SpeedDial,
  SpeedDialAction,
} from "@mui/material";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ROADMAP_ENDPOINTS, PROGRESS_ENDPOINTS } from "../../constants";
import { Stepper, Step, StepLabel } from "@mui/material";
import { IconButton } from "@mui/material";
import { makeAuthenticatedRequest } from "../../utils/api";
import "./RoadmapDetails.css";

const RoadmapDetails = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [rawRoadmapData, setRawRoadmapData] = useState<any>(null); // Store raw API response
  const [loading, setLoading] = useState(true);
  const [selectedTopicExplanation, setSelectedTopicExplanation] = useState<
    string | null
  >(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationCache, setExplanationCache] = useState<{
    [key: string]: string;
  }>({});
  const [visitedTopics, setVisitedTopics] = useState<Set<string>>(new Set());
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set()
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null); // Store only ID, not object
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showTopicCompletionDial, setShowTopicCompletionDial] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [realtimeTopicStatus, setRealtimeTopicStatus] = useState<{[key: string]: string}>({}); // Real-time status updates

  // Store original API structure for order preservation
  const originalStructure = useMemo(() => {
    if (!rawRoadmapData) return null;
    return JSON.parse(JSON.stringify(rawRoadmapData));
  }, [rawRoadmapData]);

  // Utility functions for original structure access
  const getOriginalMilestones = (): any[] => {
    return originalStructure?.milestones || [];
  };

  const getOriginalMilestoneById = (milestoneId: string): any => {
    return getOriginalMilestones().find((m: any) => m.id === milestoneId) || null;
  };

  const getOriginalTopicsForMilestone = (milestoneId: string): any[] => {
    const milestone = getOriginalMilestoneById(milestoneId);
    return milestone?.topics || [];
  };

  const getCurrentActiveMilestone = (): any => {
    return activeMilestoneId ? getOriginalMilestoneById(activeMilestoneId) : null;
  };

  const findTopicInOriginalStructure = (topicId: string): any => {
    if (!originalStructure?.milestones) return null;
    
    for (const milestone of originalStructure.milestones) {
      if (milestone.topics) {
        const topic = milestone.topics.find((t: any) => t.id === topicId);
        if (topic) return topic;
      }
    }
    return null;
  };

  const getCurrentTopicStatus = (topicId: string): string => {
    if (realtimeTopicStatus[topicId]) {
      return realtimeTopicStatus[topicId];
    }
    const originalTopic = findTopicInOriginalStructure(topicId);
    return originalTopic?.progress?.status || 'not_started';
  };

  const updateRealtimeTopicStatus = (topicId: string, status: string) => {
    setRealtimeTopicStatus(prev => ({
      ...prev,
      [topicId]: status
    }));
  };

  const getEnhancedTopicsForMilestone = (milestoneId: string): any[] => {
    const originalTopics = getOriginalTopicsForMilestone(milestoneId);
    
    const enhancedTopics = originalTopics.map(topic => ({
      ...topic,
      progress: {
        ...topic.progress,
        status: getCurrentTopicStatus(topic.id)
      }
    }));
    
    // Sort topics: completed first, then in-progress, then not started
    return enhancedTopics.sort((a, b) => {
      const statusA = a.progress?.status || 'not_started';
      const statusB = b.progress?.status || 'not_started';
      
      // Priority order: completed > in_progress > not_started
      const statusPriority: { [key: string]: number } = {
        'completed': 1,
        'in_progress': 2,
        'not_started': 3
      };
      
      return (statusPriority[statusA] || 3) - (statusPriority[statusB] || 3);
    });
  };

  useEffect(() => {
    const fetchRoadmapWithProgress = async () => {
      try {
        const roadmapResponse = await makeAuthenticatedRequest(ROADMAP_ENDPOINTS.GET_BY_ID(roadmapId));
        if (!roadmapResponse.ok) {
          throw new Error(`Failed to fetch roadmap: ${roadmapResponse.status}`);
        }
        const roadmapData = await roadmapResponse.json();
        
        setRawRoadmapData(roadmapData);
        setRoadmap(roadmapData);

        // Extract completed milestones
        const completedMilestoneIds = new Set<string>();
        if (roadmapData.milestones) {
          roadmapData.milestones.forEach((milestone: any) => {
            if (milestone.progress?.status === 'completed') {
              completedMilestoneIds.add(milestone.id);
            }
          });
        }
        setCompletedMilestones(completedMilestoneIds);
        
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roadmapId) fetchRoadmapWithProgress();
  }, [roadmapId]);

  useEffect(() => {
    if (originalStructure) {
      autoNavigateToNextTopic();
    }
  }, [originalStructure]);

  const handleTopicClick = async (topicId: string) => {
    setActiveTopicId(topicId);
    setVisitedTopics((prev) => new Set(prev).add(topicId));

    // Check if explanation is already cached
    if (explanationCache[topicId]) {
      setSelectedTopicExplanation(explanationCache[topicId]);
      
      // Show completion dial based on current status (real-time + frozen)
      const currentStatus = getCurrentTopicStatus(topicId);
      if (currentStatus !== 'completed') {
        setShowTopicCompletionDial(true);
      } else {
        setShowTopicCompletionDial(false);
      }
      return;
    }

    // Check if topic already has explanation in original structure
    let embeddedExplanation = null;
    if (originalStructure?.milestones) {
      for (const milestone of originalStructure.milestones) {
        const topic = milestone.topics?.find((t: any) => t.id === topicId);
        if (topic && topic.explanation_md) {
          embeddedExplanation = topic.explanation_md;
          break;
        }
      }
    }

    if (embeddedExplanation) {
      setExplanationCache((prev) => ({ ...prev, [topicId]: embeddedExplanation }));
      setSelectedTopicExplanation(embeddedExplanation);
      
      const currentStatus = getCurrentTopicStatus(topicId);
      setShowTopicCompletionDial(currentStatus !== 'completed');
      return;
    }

    setExplanationLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        ROADMAP_ENDPOINTS.TOPIC_EXPLANATION(topicId)
      );
      const data = await response.json();
      setExplanationCache((prev) => ({ ...prev, [topicId]: data.explanation }));
      setSelectedTopicExplanation(data.explanation);
      
      const currentStatus = getCurrentTopicStatus(topicId);
      setShowTopicCompletionDial(currentStatus !== 'completed');
    } catch (error) {
      console.error("Failed to fetch topic explanation:", error);
      setSelectedTopicExplanation("Error loading explanation.");
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleTopicCompletion = async () => {
    if (!activeTopicId || isUpdatingProgress) return;

    setIsUpdatingProgress(true);

    try {
      const response = await makeAuthenticatedRequest(PROGRESS_ENDPOINTS.UPDATE, {
        method: "POST",
        body: {
          topic_id: activeTopicId,
          status: "completed"
        },
      });

      if (response.ok) {
        updateRealtimeTopicStatus(activeTopicId, 'completed');
        setShowTopicCompletionDial(false);
      } else {
        updateRealtimeTopicStatus(activeTopicId, 'completed');
        setShowTopicCompletionDial(false);
      }
    } catch (error) {
      updateRealtimeTopicStatus(activeTopicId, 'completed');
      setShowTopicCompletionDial(false);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const autoNavigateToNextTopic = () => {
    if (!originalStructure?.milestones?.length) return;

    for (const milestone of originalStructure.milestones) {
      if (!milestone.topics?.length) continue;
      
      for (let topicIndex = 0; topicIndex < milestone.topics.length; topicIndex++) {
        const topic = milestone.topics[topicIndex];
        const topicStatus = topic.progress?.status || 'not_started';
        
        const isCompleted = topicStatus === 'completed';
        const isNotStarted = topicStatus === 'not_started';
        const isInProgress = topicStatus === 'in_progress';
        const isUnlocked = isCompleted || topicIndex === 0 || milestone.topics[topicIndex - 1].progress?.status === 'completed';
        
        if (isInProgress) {
          setActiveMilestoneId(milestone.id);
          setDrawerOpen(true);
          setTimeout(() => handleTopicClick(topic.id), 500);
          return;
        }
        
        if (isNotStarted && isUnlocked) {
          setActiveMilestoneId(milestone.id);
          setDrawerOpen(true);
          setTimeout(() => handleTopicClick(topic.id), 500);
          return;
        }
      }
    }
    
    const firstMilestone = originalStructure.milestones[0];
    if (firstMilestone?.topics?.length > 0) {
      const firstTopic = firstMilestone.topics[0];
      setActiveMilestoneId(firstMilestone.id);
      setDrawerOpen(true);
      setTimeout(() => handleTopicClick(firstTopic.id), 500);
    }
  };

  const handleContinueLearning = () => {
    setShowSpeedDial(false);
    setActiveTopicId(null);
    setSelectedTopicExplanation(null);
    setShowTopicCompletionDial(false);
    
    const originalMilestones = getOriginalMilestones();
    const currentMilestoneIndex = originalMilestones.findIndex(
      (m: any) => m.id === activeMilestoneId
    );
    
    const nextMilestone = originalMilestones.find((milestone: any, index: number) => {
      return index > currentMilestoneIndex && !completedMilestones.has(milestone.id);
    });
    
    if (nextMilestone) {
      setActiveMilestoneId(nextMilestone.id);
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
      setActiveMilestoneId(null);
    }
  };

  if (loading) {
    return (
      <div className="roadmap-details-container">
        <div className="loading-container">
          <CircularProgress className="loading-spinner" size={60} />
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-details-container">
      {/* Header Section */}
      <div className="roadmap-header-section">
        <div className="roadmap-header-content">
          <IconButton
            onClick={() => setDrawerOpen(true)}
            className="menu-button"
            aria-label="Open Milestone Drawer"
          >
            ☰
          </IconButton>
          <Typography variant="h3" className="roadmap-title">
            {roadmap.title}
          </Typography>
        </div>
      </div>

      <div className="roadmap-main-content">
        <div className="roadmap-stepper fade-in-up">
          <Stepper
            activeStep={getOriginalMilestones().findIndex(
              (m) => m.id === activeMilestoneId
            )}
            alternativeLabel
            className="roadmap-stepper"
          >
            {getOriginalMilestones().map((milestone: any, index: number) => {
              const isFirst = index === 0;
              const originalMilestones = getOriginalMilestones();
              const isUnlocked =
                isFirst ||
                completedMilestones.has(originalMilestones[index - 1]?.id);
              return (
                <Step
                  key={milestone.id}
                  completed={completedMilestones.has(milestone.id)}
                >
                  <StepLabel
                    onClick={() => {
                      if (isUnlocked) {
                        setActiveMilestoneId(milestone.id);
                        setDrawerOpen(true);
                      }
                    }}
                    sx={{ 
                      cursor: isUnlocked ? "pointer" : "not-allowed",
                      opacity: isUnlocked ? 1 : 0.5,
                    }}
                  >
                    {milestone.name}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </div>

        {/* Topic Explanation Section */}
        {activeTopicId && (
          <div className="topic-explanation-container fade-in-up">
            <div className="topic-explanation-header">
              <Typography variant="h4" component="h3">
                Topic Explanation
              </Typography>
            </div>
            <div className="explanation-content">
              {explanationLoading ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <CircularProgress className="loading-spinner" />
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading explanation...
                  </Typography>
                </Box>
              ) : (
                <ReactMarkdown>{selectedTopicExplanation}</ReactMarkdown>
              )}
            </div>
          </div>
        )}

        {/* Topic Completion Speed Dial */}
        {showTopicCompletionDial && activeTopicId && (
          <SpeedDial
            ariaLabel="Complete Topic"
            sx={{ 
              position: 'fixed', 
              bottom: 32, 
              right: 32,
              '& .MuiSpeedDial-fab': {
                backgroundColor: isUpdatingProgress ? '#666' : '#2e7d32',
                color: 'white',
                cursor: isUpdatingProgress ? 'not-allowed' : 'pointer',
                '&:hover': {
                  backgroundColor: isUpdatingProgress ? '#666' : '#1b5e20',
                },
              }
            }}
            icon={
              isUpdatingProgress ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <span style={{ fontSize: "24px" }}>✓</span>
              )
            }
            onClick={isUpdatingProgress ? undefined : handleTopicCompletion}
            open={false}
          />
        )}
      </div>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="milestone-drawer"
      >
        <div className="milestone-drawer-content slide-in-left">
          {activeMilestoneId && (() => {
            // Get current active milestone from original structure using ID
            const currentActiveMilestone = getCurrentActiveMilestone();
            // Get enhanced topics with real-time status updates and sorted by completion
            const enhancedTopics = getEnhancedTopicsForMilestone(activeMilestoneId);
            
            if (!currentActiveMilestone) {
              return <Typography>Error loading milestone</Typography>;
            }
            
            return (
              <>
                <div className="milestone-header">
                  <Typography variant="h5" component="h2">
                     {currentActiveMilestone.name}
                  </Typography>
                </div>

                <List className="topics-list">
                  {enhancedTopics.map((enhancedTopic: any, index: number) => {
                    const currentStatus = enhancedTopic.progress?.status || 'not_started';
                    const isCompleted = currentStatus === 'completed';
                    const isInProgress = currentStatus === 'in_progress';
                    const isNotStarted = currentStatus === 'not_started';
                    const isUnlocked = isCompleted || index === 0 || enhancedTopics[index - 1].progress?.status === 'completed';
                    
                    const isVisited = visitedTopics.has(enhancedTopic.id);
                    
                    return (
                      <ListItem
                        key={enhancedTopic.id}
                        component="button"
                        onClick={() => {
                          if (isUnlocked) {
                            handleTopicClick(enhancedTopic.id);
                            setDrawerOpen(false);
                          }
                        }}
                        className={`topic-item ${isCompleted ? 'completed' : isVisited ? 'visited' : ''} ${!isUnlocked ? 'disabled' : ''}`}
                        disabled={!isUnlocked}
                      >
                        <Typography variant="subtitle1" className="topic-title">
                          <span className={`topic-icon ${isCompleted ? 'completed' : !isUnlocked ? 'disabled' : ''}`}>
                            {isCompleted ? '✓' : isInProgress ? '▶' : index + 1}
                          </span>
                          {enhancedTopic.name}
                          {!isCompleted && !isUnlocked && <span className="lock-icon">🔒</span>}
                        </Typography>
                      </ListItem>
                    );
                  })}
                </List>

                {(() => {
                  const completedCount = enhancedTopics.filter((t: any) => t.progress?.status === 'completed').length;
                  const progressPercentage = (completedCount / enhancedTopics.length) * 100;
                  
                  return (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={progressPercentage}
                        className="milestone-progress"
                      />

                      <Box sx={{ mt: 1, textAlign: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress: {completedCount} / {enhancedTopics.length} topics completed
                        </Typography>
                      </Box>
                    </>
                  );
                })()}

                {(() => {
                  const allTopicsCompleted = enhancedTopics.every((topic: any) => topic.progress?.status === 'completed');
                  const milestoneAlreadyCompleted = currentActiveMilestone.progress?.status === 'completed';
                  
                  return allTopicsCompleted && !milestoneAlreadyCompleted && (
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                      <button
                        className="complete-milestone-btn"
                        onClick={() => {
                          setCompletedMilestones((prev) =>
                            new Set(prev).add(currentActiveMilestone.id)
                          );
                          setShowSpeedDial(true);
                        }}
                      >
                        ✅ Complete Milestone
                      </button>
                    </Box>
                  );
                })()}
              </>
            );
          })()}
        </div>
      </Drawer>

      {showSpeedDial && activeMilestoneId && (() => {
        const currentActiveMilestone = getCurrentActiveMilestone();
        
        return (
          <div className="milestone-completion-message">
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1 }}>
              Milestone Completed!
            </Typography>
            <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
              Congratulations! You have successfully completed "{currentActiveMilestone?.name}".
            </Typography>
            {(() => {
              // Use original structure to check for next milestone
              const originalMilestones = getOriginalMilestones();
              const currentMilestoneIndex = originalMilestones.findIndex(
                (m: any) => m.id === activeMilestoneId
              );
              const hasNextMilestone = originalMilestones.find((milestone: any, index: number) => {
                return index > currentMilestoneIndex && !completedMilestones.has(milestone.id);
              });
              
              return (
                <button 
                  className="close-message-btn"
                  onClick={handleContinueLearning}
                >
                  {hasNextMilestone ? 'Continue to Next Milestone' : 'View Roadmap'}
                </button>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
};

export default RoadmapDetails;
