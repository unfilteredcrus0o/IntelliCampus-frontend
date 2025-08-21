import React, { useEffect, useState } from "react";
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
  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showTopicCompletionDial, setShowTopicCompletionDial] = useState(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        console.log('Fetching roadmap with ID:', roadmapId);
        const response = await makeAuthenticatedRequest(ROADMAP_ENDPOINTS.GET_BY_ID(roadmapId));
        
        if (!response.ok) {
          throw new Error(`Failed to fetch roadmap: ${response.status}`);
        }
        const data = await response.json();
        setRoadmap(data);
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roadmapId) fetchRoadmap();
  }, [roadmapId]);

  const handleTopicClick = async (topicId: string) => {
    setActiveTopicId(topicId);
    setVisitedTopics((prev) => new Set(prev).add(topicId));

    if (explanationCache[topicId]) {
      setSelectedTopicExplanation(explanationCache[topicId]);
      // Show completion dial if topic is not already completed
      if (!completedTopics.has(topicId)) {
        setShowTopicCompletionDial(true);
      } else {
        setShowTopicCompletionDial(false);
      }
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
      
      // Show completion dial if topic is not already completed
      if (!completedTopics.has(topicId)) {
        setShowTopicCompletionDial(true);
      } else {
        setShowTopicCompletionDial(false);
      }
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
      // Make API call to update topic progress
      const response = await makeAuthenticatedRequest(PROGRESS_ENDPOINTS.UPDATE, {
        method: "POST",
        body: {
          topic_id: activeTopicId,
          status: "completed"
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Progress updated successfully:", data);
        
        // Update local state
        setCompletedTopics((prev) => new Set(prev).add(activeTopicId));
        setShowTopicCompletionDial(false);
        
        // Log progress information for debugging
        if (data.roadmap_progress) {
          console.log(`Progress: ${data.roadmap_progress.completed_topics}/${data.roadmap_progress.total_topics} topics completed (${data.roadmap_progress.progress_percentage}%)`);
        }
      } else {
        console.error("Failed to update progress:", response.status);
        // Still update local state for better UX even if API fails
        setCompletedTopics((prev) => new Set(prev).add(activeTopicId));
        setShowTopicCompletionDial(false);
      }
    } catch (error) {
      console.error("Error updating topic progress:", error);
      // Still update local state for better UX even if API fails
      setCompletedTopics((prev) => new Set(prev).add(activeTopicId));
      setShowTopicCompletionDial(false);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const isTopicUnlocked = (milestone: any, topicIndex: number): boolean => {
    if (topicIndex === 0) return true; // First topic is always unlocked
    
    // Check if previous topic is completed
    const previousTopic = milestone.topics[topicIndex - 1];
    return completedTopics.has(previousTopic.id);
  };

  const handleContinueLearning = () => {
    // Close the completion message
    setShowSpeedDial(false);
    
    // Clear any active topic explanation and completion dial
    setActiveTopicId(null);
    setSelectedTopicExplanation(null);
    setShowTopicCompletionDial(false);
    
    // Find the next uncompleted milestone
    const currentMilestoneIndex = roadmap.milestones.findIndex(
      (m: any) => m.id === activeMilestone?.id
    );
    
    // Look for the next milestone that isn't completed
    const nextMilestone = roadmap.milestones.find((milestone: any, index: number) => {
      return index > currentMilestoneIndex && !completedMilestones.has(milestone.id);
    });
    
    if (nextMilestone) {
      // Set the next milestone as active and open the drawer
      setActiveMilestone(nextMilestone);
      setDrawerOpen(true);
    } else {
      // All milestones completed or no next milestone, close drawer
      setDrawerOpen(false);
      setActiveMilestone(null);
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

      {/* Main Content */}
      <div className="roadmap-main-content">
        {/* Stepper Section */}
        <div className="roadmap-stepper fade-in-up">
          <Stepper
            activeStep={roadmap.milestones.findIndex(
              (m) => m.id === activeMilestone?.id
            )}
            alternativeLabel
            className="roadmap-stepper"
          >
            {roadmap.milestones.map((milestone: any, index: number) => {
              const isFirst = index === 0;
              const isUnlocked =
                isFirst ||
                completedMilestones.has(roadmap.milestones[index - 1]?.id);
              return (
                <Step
                  key={milestone.id}
                  completed={completedMilestones.has(milestone.id)}
                >
                  <StepLabel
                    onClick={() => {
                      if (isUnlocked) {
                        setActiveMilestone(milestone);
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

      {/* Milestone Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="milestone-drawer"
      >
        <div className="milestone-drawer-content slide-in-left">
          {activeMilestone && (
            <>
              <div className="milestone-header">
                <Typography variant="h5" component="h2">
                   {activeMilestone.name}
                </Typography>
              </div>

                                <List className="topics-list">
                    {activeMilestone.topics?.map((topic: any, index: number) => {
                      const isUnlocked = isTopicUnlocked(activeMilestone, index);
                      const isCompleted = completedTopics.has(topic.id);
                      const isVisited = visitedTopics.has(topic.id);
                      
                      return (
                        <ListItem
                          key={topic.id}
                          component="button"
                          onClick={() => {
                            if (isUnlocked) {
                              handleTopicClick(topic.id);
                              setDrawerOpen(false);
                            }
                          }}
                          className={`topic-item ${isCompleted ? 'completed' : isVisited ? 'visited' : ''} ${!isUnlocked ? 'disabled' : ''}`}
                          disabled={!isUnlocked}
                        >
                          <Typography variant="subtitle1" className="topic-title">
                            <span className={`topic-icon ${isCompleted ? 'completed' : !isUnlocked ? 'disabled' : ''}`}>
                              {isCompleted ? '✓' : index + 1}
                            </span>
                            {topic.name}
                            {!isUnlocked && <span className="lock-icon">🔒</span>}
                          </Typography>
                        </ListItem>
                      );
                    })}
                  </List>

                                {/* Progress Bar */}
                  <LinearProgress
                    variant="determinate"
                    value={
                      (activeMilestone.topics.filter((t: any) =>
                        completedTopics.has(t.id)
                      ).length /
                        activeMilestone.topics.length) *
                      100
                    }
                    className="milestone-progress"
                  />

                  <Box sx={{ mt: 1, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress: {activeMilestone.topics.filter((t: any) =>
                        completedTopics.has(t.id)
                      ).length} / {activeMilestone.topics.length} topics completed
                    </Typography>
                  </Box>

                  {/* Complete Milestone Button */}
                  {activeMilestone.topics.every((topic: any) =>
                    completedTopics.has(topic.id)
                  ) &&
                    !completedMilestones.has(activeMilestone.id) && (
                      <Box sx={{ mt: 3, textAlign: "center" }}>
                        <button
                          className="complete-milestone-btn"
                          onClick={() => {
                            setCompletedMilestones((prev) =>
                              new Set(prev).add(activeMilestone.id)
                            );
                            setShowSpeedDial(true);
                          }}
                        >
                          ✅ Complete Milestone
                        </button>
                      </Box>
                    )}
            </>
          )}
        </div>
      </Drawer>

      {/* Milestone Completion Message */}
      {showSpeedDial && (
        <div className="milestone-completion-message">
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32', mb: 1 }}>
            Milestone Completed!
          </Typography>
          <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
            Congratulations! You have successfully completed "{activeMilestone?.name}".
          </Typography>
          {(() => {
            const currentMilestoneIndex = roadmap.milestones.findIndex(
              (m: any) => m.id === activeMilestone?.id
            );
            const hasNextMilestone = roadmap.milestones.find((milestone: any, index: number) => {
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
      )}
    </div>
  );
};

export default RoadmapDetails;
