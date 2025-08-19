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
import { ROADMAP_ENDPOINTS } from "../../constants";
import { Stepper, Step, StepLabel } from "@mui/material";
import { IconButton } from "@mui/material";

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
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set()
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [showSpeedDial, setShowSpeedDial] = useState(false);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await fetch(ROADMAP_ENDPOINTS.GET_BY_ID(roadmapId));
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
      return;
    }

    setExplanationLoading(true);
    try {
      const response = await fetch(
        ROADMAP_ENDPOINTS.TOPIC_EXPLANATION(topicId)
      );
      const data = await response.json();
      setExplanationCache((prev) => ({ ...prev, [topicId]: data.explanation }));
      setSelectedTopicExplanation(data.explanation);
    } catch (error) {
      console.error("Failed to fetch topic explanation:", error);
      setSelectedTopicExplanation("Error loading explanation.");
    } finally {
      setExplanationLoading(false);
    }
  };

  if (loading) return <CircularProgress sx={{ alignSelf: "center" }} />;

  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ fontSize: 24 }}
          aria-label="Open Milestone Drawer"
        >
          ☰
        </IconButton>
        <Typography variant="h5" sx={{ ml: 1 }}>
          Roadmap
        </Typography>
      </Box>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          {roadmap.title}
        </Typography>

        <Stepper
          activeStep={roadmap.milestones.findIndex(
            (m) => m.id === activeMilestone?.id
          )}
          alternativeLabel
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
                  sx={{ cursor: isUnlocked ? "pointer" : "not-allowed" }}
                >
                  {milestone.name}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          <Box sx={{ width: 350, p: 2 }}>
            {activeMilestone && (
              <>
                <Typography variant="h6">📚 {activeMilestone.name}</Typography>
                <List>
                  {activeMilestone.topics.map((topic: any) => (
                    <ListItem
                      key={topic.id}
                      component="button"
                      onClick={() => {
                        handleTopicClick(topic.id);
                        setDrawerOpen(false); // Close drawer when topic is clicked
                      }}
                      sx={{ flexDirection: "column", alignItems: "flex-start" }}
                    >
                      <Typography variant="subtitle1">
                        📘 {topic.name}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <LinearProgress
                  variant="determinate"
                  value={
                    (activeMilestone.topics.filter((t: any) =>
                      visitedTopics.has(t.id)
                    ).length /
                      activeMilestone.topics.length) *
                    100
                  }
                  sx={{ mt: 2 }}
                />

                {activeMilestone.topics.every((topic: any) =>
                  visitedTopics.has(topic.id)
                ) &&
                  !completedMilestones.has(activeMilestone.id) && (
                    <Box sx={{ mt: 2, textAlign: "center" }}>
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "#2e7d32",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
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
          </Box>
        </Drawer>

        {activeTopicId && (
          <Box
            sx={{
              mt: 4,
              p: 2,
              border: "1px solid #ddd",
              borderRadius: 2,
              maxHeight: "60vh",
              overflowY: "auto",
              backgroundColor: "#fff", // Ensure it's not greyed out
            }}
          >
            <Typography variant="h5" gutterBottom>
              📖 Topic Explanation
            </Typography>
            {explanationLoading ? (
              <CircularProgress />
            ) : (
              <ReactMarkdown>{selectedTopicExplanation}</ReactMarkdown>
            )}
          </Box>
        )}

        {showSpeedDial && (
          <SpeedDial
            ariaLabel="Milestone Completed"
            sx={{ position: "fixed", bottom: 16, right: 16 }}
            icon={<span style={{ fontSize: "24px" }}>🎉</span>}
            onClose={() => setShowSpeedDial(false)}
            onOpen={() => setShowSpeedDial(true)}
            open={showSpeedDial}
          >
            <SpeedDialAction
              icon={<span style={{ fontSize: "20px" }}>✅</span>}
              tooltipTitle={`Milestone "${activeMilestone?.name}" completed!`}
              tooltipOpen
            />
          </SpeedDial>
        )}
      </Box>
    </>
  );
};

export default RoadmapDetails;
