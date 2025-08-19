import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  Typography,
  LinearProgress,
  CircularProgress,
  Box,
} from "@mui/material";
import { ROADMAP_ENDPOINTS } from "../../constants";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

const RoadmapDetails = () => {
  const { roadmapId } = useParams<{ roadmapId: string }>();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopicExplanation, setSelectedTopicExplanation] = useState<
    string | null
  >(null);
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanationCache, setExplanationCache] = useState<{
    [key: string]: string;
  }>({});
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(
    null
  );

  if (!roadmapId) {
    return <Typography>Invalid roadmap ID</Typography>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await fetch(ROADMAP_ENDPOINTS.GET_BY_ID(roadmapId));
        const data = await response.json();
        setRoadmap(data);
        if (data.milestones?.length > 0) {
          setExpandedMilestoneId(data.milestones[0].id);
        }
      } catch (error) {
        console.error("Error fetching roadmap:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId]);

  
  const handleTopicClick = async (topicId: string) => {
    setActiveTopicId(topicId);

    if (explanationCache[topicId]) {
      setSelectedTopicExplanation(explanationCache[topicId]);
      return;
    }

    setExplanationLoading(true);
    try {
      const response = await fetch(
        `${ROADMAP_ENDPOINTS.TOPIC_EXPLANATION(topicId)}`
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

  if(loading) {return <CircularProgress sx={{ alignSelf: "center" }} />}

  return (
    <div>      
      <Typography variant="h4" gutterBottom>
        {roadmap.title}
      </Typography>
      {roadmap.milestones.map((milestone) => (
        <Accordion
          key={milestone.id}
          expanded={expandedMilestoneId === milestone.id}
          onChange={() =>
            setExpandedMilestoneId(
              expandedMilestoneId === milestone.id ? null : milestone.id
            )
          }
        >
          <AccordionSummary
           expandIcon={<span style={{ fontSize: 18 }}>🔽</span>}
          >
            <Typography>{milestone.name}</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <List>
              {milestone?.topics?.map((topic) => (
                <ListItem
                  key={topic.id}
                  component = 'button'
                  onClick={() => handleTopicClick(topic.id)}
                  sx={{ flexDirection: "column", alignItems: "flex-start" }}
                >
                  <Typography variant="subtitle1">{topic.name}</Typography>

                  {activeTopicId === topic.id && (
                    <Box sx={{ mt: 1, width: "100%" }}>
                      {explanationLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <ReactMarkdown>
                          {selectedTopicExplanation}
                        </ReactMarkdown>
                      )}
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
            <LinearProgress
              variant="determinate"
              value={0}
              sx={{ marginTop: 2 }}
            />
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
};

export default RoadmapDetails;
