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
  Button,
  Modal,
  Alert,
} from "@mui/material";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ROADMAP_ENDPOINTS, PROGRESS_ENDPOINTS } from "../../constants";
import { Stepper, Step, StepLabel } from "@mui/material";
import { IconButton } from "@mui/material";
import { makeAuthenticatedRequest } from "../../utils/api";
import Quiz from "../../components/Quiz";
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
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [quizTopicId, setQuizTopicId] = useState<string | null>(null);

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

    // Update topic status to "in_progress" if it's not started or completed
    const currentStatus = getCurrentTopicStatus(topicId);
    if (currentStatus === 'not_started') {
      updateRealtimeTopicStatus(topicId, 'in_progress');
      
      // Also update backend (optional - can be done when backend is ready)
      try {
        await makeAuthenticatedRequest(PROGRESS_ENDPOINTS.UPDATE_TOPIC(topicId), {
          method: "PUT",
          body: {
            status: "in_progress"
          },
        });
      } catch (error) {
        console.log("Failed to update topic progress to in_progress:", error);
        // Not critical, continue with UI updates
      }
    }

    // Check if explanation is already cached
    if (explanationCache[topicId]) {
      setSelectedTopicExplanation(explanationCache[topicId]);
      
      // Show completion dial based on current status (real-time + frozen)
      const updatedStatus = getCurrentTopicStatus(topicId);
      if (updatedStatus !== 'completed') {
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
      
      const updatedStatus = getCurrentTopicStatus(topicId);
      setShowTopicCompletionDial(updatedStatus !== 'completed');
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
      
      const updatedStatus = getCurrentTopicStatus(topicId);
      setShowTopicCompletionDial(updatedStatus !== 'completed');
    } catch (error) {
      console.error("Failed to fetch topic explanation:", error);
      setSelectedTopicExplanation("Error loading explanation.");
    } finally {
      setExplanationLoading(false);
    }
  };

  const handleTopicCompletion = () => {
    // Open quiz instead of directly completing the topic
    if (activeTopicId && !isUpdatingProgress) {
      setQuizTopicId(activeTopicId);
      setQuizModalOpen(true);
    }
  };

  const autoNavigateToNextTopic = () => {
    if (!originalStructure?.milestones?.length) return;

    for (const milestone of originalStructure.milestones) {
      if (!milestone.topics?.length) continue;
      
      for (let topicIndex = 0; topicIndex < milestone.topics.length; topicIndex++) {
        const topic = milestone.topics[topicIndex];
        // Use getCurrentTopicStatus to get real-time status including quiz completions
        const topicStatus = getCurrentTopicStatus(topic.id);
        
        const isCompleted = topicStatus === 'completed';
        const isNotStarted = topicStatus === 'not_started';
        const isInProgress = topicStatus === 'in_progress';
        
        // Check if previous topic is completed (use real-time status)
        const prevTopicCompleted = topicIndex === 0 || 
          getCurrentTopicStatus(milestone.topics[topicIndex - 1].id) === 'completed';
        const isUnlocked = isCompleted || prevTopicCompleted;
        
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
    
    // If no next topic found, check if we should move to next milestone
    const currentMilestoneIndex = originalStructure.milestones.findIndex(
      (m: any) => m.id === activeMilestoneId
    );
    
    // Check if current milestone is complete
    if (currentMilestoneIndex >= 0) {
      const currentMilestone = originalStructure.milestones[currentMilestoneIndex];
      const allTopicsCompleted = currentMilestone.topics?.every((topic: any) => 
        getCurrentTopicStatus(topic.id) === 'completed'
      );
      
      if (allTopicsCompleted) {
        // Mark milestone as completed and show completion message
        setCompletedMilestones(prev => new Set(prev).add(currentMilestone.id));
        setShowSpeedDial(true);
        return;
      }
    }
    
    // Fallback: navigate to first available topic
    const firstMilestone = originalStructure.milestones[0];
    if (firstMilestone?.topics?.length > 0) {
      const firstTopic = firstMilestone.topics[0];
      setActiveMilestoneId(firstMilestone.id);
      setDrawerOpen(true);
      setTimeout(() => handleTopicClick(firstTopic.id), 500);
    }
  };

  const handleTakeQuiz = () => {
    if (activeTopicId) {
      setQuizTopicId(activeTopicId);
      setQuizModalOpen(true);
    }
  };

  const handleCloseQuiz = () => {
    setQuizModalOpen(false);
    setQuizTopicId(null);
  };

  const handleQuizCompletion = async (passed: boolean) => {
    if (!activeTopicId || !passed) {
      handleCloseQuiz();
      return;
    }

    // Quiz passed - now complete the topic
    setIsUpdatingProgress(true);
    
    try {
      const response = await makeAuthenticatedRequest(PROGRESS_ENDPOINTS.UPDATE_TOPIC(activeTopicId), {
        method: "PUT",
        body: {
          status: "completed"
        },
      });

      if (response.ok) {
        updateRealtimeTopicStatus(activeTopicId, 'completed');
        setShowTopicCompletionDial(false);
        
        // Add to completed topics set
        setCompletedTopics(prev => new Set(prev).add(activeTopicId));
        
        // Close quiz modal first
        handleCloseQuiz();
        
        // Auto-navigate to next topic after a short delay
        setTimeout(() => {
          autoNavigateToNextTopic();
        }, 1000);
        
      } else {
        updateRealtimeTopicStatus(activeTopicId, 'completed');
        setShowTopicCompletionDial(false);
        setCompletedTopics(prev => new Set(prev).add(activeTopicId));
        handleCloseQuiz();
        setTimeout(() => {
          autoNavigateToNextTopic();
        }, 1000);
      }
    } catch (error) {
      updateRealtimeTopicStatus(activeTopicId, 'completed');
      setShowTopicCompletionDial(false);
      setCompletedTopics(prev => new Set(prev).add(activeTopicId));
      handleCloseQuiz();
      setTimeout(() => {
        autoNavigateToNextTopic();
      }, 1000);
    } finally {
      setIsUpdatingProgress(false);
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
    <div className={`roadmap-details-container ${isContentExpanded ? 'content-expanded' : ''}`}>
      {/* Header Section */}
      {!isContentExpanded && (
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
      )}

      <div className="roadmap-main-content">
        {!isContentExpanded && (
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
        )}

        {/* Topic Explanation Section */}
        {activeTopicId && (
          <div className={`topic-explanation-container fade-in-up ${isContentExpanded ? 'expanded' : ''}`}>
            <div className="topic-explanation-header">
              <Typography variant="h4" component="h3">
                Topic Explanation
              </Typography>
              <IconButton
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="expand-toggle-button"
                aria-label={isContentExpanded ? "Collapse content" : "Expand content"}
              >
                {isContentExpanded ? "⤋" : "⤢"}
              </IconButton>
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

        {/* Topic Quiz & Completion Speed Dial */}
        {showTopicCompletionDial && activeTopicId && (
          <SpeedDial
            ariaLabel="Take Quiz to Complete Topic"
            sx={{ 
              position: 'fixed', 
              bottom: 32, 
              right: 32,
              '& .MuiSpeedDial-fab': {
                backgroundColor: isUpdatingProgress ? '#666' : '#6a1b9a',
                color: 'white',
                cursor: isUpdatingProgress ? 'not-allowed' : 'pointer',
                '&:hover': {
                  backgroundColor: isUpdatingProgress ? '#666' : '#4a148c',
                },
              }
            }}
            icon={
              isUpdatingProgress ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <span style={{ fontSize: "20px" }}>🧠</span>
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

      {/* Quiz Modal */}
      <Modal
        open={quizModalOpen}
        onClose={handleCloseQuiz}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Box
          sx={{
            width: "90%",
            maxWidth: "900px",
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            outline: "none",
          }}
        >
          {quizTopicId && (
            <Quiz 
              topicId={quizTopicId} 
              onClose={handleCloseQuiz}
              onQuizComplete={handleQuizCompletion}
            />
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default RoadmapDetails;
