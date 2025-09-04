import React, { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Box,
  Stack,
  Snackbar,
  Alert,
  Container,
  Chip,
  FormControl,
  FormLabel,
  Divider,
} from "@mui/material";
import * as Constants from "../../constants";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest, getCurrentUserRole } from "../../utils/api";
import "./Roadmap.css";

const topicsList = ["Python", "Git", "JavaScript", "React", "CSS", "Machine Learning", "Data Science", "Web Development", "Mobile Development", "DevOps", "Cloud Computing", "Artificial Intelligence", "Database Management", "Cybersecurity", "UI/UX Design"];

// Topic categories for better organization
const topicCategories = {
  "Programming Languages": ["Python", "JavaScript", "Java", "C++", "C#", "Go", "Rust", "TypeScript"],
  "Web Development": ["React", "Angular", "Vue.js", "HTML", "CSS", "Node.js", "Express.js", "Web Development"],
  "Data & AI": ["Machine Learning", "Data Science", "Artificial Intelligence", "Deep Learning", "Natural Language Processing"],
  "Mobile Development": ["React Native", "Flutter", "iOS Development", "Android Development", "Mobile Development"],
  "DevOps & Cloud": ["Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "DevOps", "Cloud Computing"],
  "Tools & Systems": ["Git", "Database Management", "SQL", "MongoDB", "Redis", "Elasticsearch"],
  "Design & UX": ["UI/UX Design", "Figma", "Adobe XD", "User Research", "Design Systems"],
  "Security": ["Cybersecurity", "Network Security", "Web Security", "Ethical Hacking"]
};

// Get all topics from categories
const getAllTopics = () => {
  return Array.from(new Set([...topicsList, ...Object.values(topicCategories).flat()]));
};

// Get intelligent topic suggestions based on input
const getTopicSuggestions = (inputValue: string, selectedTopics: string[]) => {
  const allTopics = getAllTopics();
  const input = inputValue.toLowerCase();
  
  if (!input) return allTopics.filter(topic => !selectedTopics.includes(topic)).slice(0, 10);
  
  // Prioritize exact matches, then starts with, then contains
  const exactMatches = allTopics.filter(topic => 
    topic.toLowerCase() === input && !selectedTopics.includes(topic)
  );
  
  const startsWithMatches = allTopics.filter(topic => 
    topic.toLowerCase().startsWith(input) && 
    !selectedTopics.includes(topic) && 
    !exactMatches.includes(topic)
  );
  
  const containsMatches = allTopics.filter(topic => 
    topic.toLowerCase().includes(input) && 
    !selectedTopics.includes(topic) && 
    !exactMatches.includes(topic) &&
    !startsWithMatches.includes(topic)
  );
  
  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, 8);
};

// Get contextual suggestions based on selected topics
const getContextualSuggestions = (selectedTopics: string[], allTopics: string[]) => {
  if (selectedTopics.length === 0) return [];
  
  // Find related topics from the same categories
  const relatedTopics = new Set<string>();
  
  selectedTopics.forEach(selectedTopic => {
    Object.entries(topicCategories).forEach(([category, topics]) => {
      if (topics.some(topic => topic.toLowerCase() === selectedTopic.toLowerCase())) {
        topics.forEach(relatedTopic => {
          if (!selectedTopics.some(selected => selected.toLowerCase() === relatedTopic.toLowerCase())) {
            relatedTopics.add(relatedTopic);
          }
        });
      }
    });
  });
  
  return Array.from(relatedTopics).slice(0, 6);
};

interface Employee {
  id: string;
  name: string;
  email: string;
}

const RoadmapScreen: React.FC = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("");
  const [hours, setHours] = useState<number | "">("");
  const [minutes, setMinutes] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentToastOpen, setAssignmentToastOpen] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  
  // Assignment-related state
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showAssignmentSection, setShowAssignmentSection] = useState(false);
  
  const { ROADMAP_ENDPOINTS, USER_ENDPOINTS, ASSIGNMENT_ENDPOINTS } = Constants;
  const navigate = useNavigate();
  const userRole = getCurrentUserRole();
  // Check if user can assign roadmaps
  useEffect(() => {
    if (userRole === "manager" || userRole === "superadmin") {
      setShowAssignmentSection(true);
      fetchEmployees();
    }
  }, [userRole]);

  /*
  Fetch call to get the employees details for assignments based on:
  userRole - superadmin = shows all the employees + managers
  userRole - manager = shows their employees
  */

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const allUsers = [];

      const employeePromise = makeAuthenticatedRequest(
        USER_ENDPOINTS.GET_EMPLOYEES,
        {
          method: "GET",
        }
      );

      const managerPromise =
        userRole === "superadmin"
          ? makeAuthenticatedRequest(USER_ENDPOINTS.GET_MANAGERS, {
              method: "GET",
            })
          : null;

      const [employeesResponse, managersResponse] = await Promise.all([
        employeePromise,
        managerPromise,
      ]);

      if (employeesResponse?.ok) {
        const employeeData = await employeesResponse.json();
        allUsers.push(...employeeData);
      } else {
        console.error("Failed to fetch employees");
      }

      if (userRole === "superadmin" && managersResponse?.ok) {
        const managersData = await managersResponse.json();
        allUsers.push(...managersData);
      } else if (userRole === "superadmin") {
        console.error("Failed to fetch managers");
      }

      if (allUsers.length > 0) {
        setEmployees(allUsers);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const isFormValid =
  selectedTopics.length > 0 &&
  skillLevel !== "" &&
  ((Number(hours) || 0) > 0 || (Number(minutes) || 0) > 0);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const formattedDuration = `${Math.floor(totalMinutes / 60)}h ${
      totalMinutes % 60
    }m`;

    const roadmapPayload = {
      selectedTopics,
      skillLevel,
      duration: formattedDuration,
      title: `${selectedTopics.join(", ")} Learning Roadmap`,
    };

    try {
      // Step 1: Create the roadmap
      const roadmapResponse = await makeAuthenticatedRequest(ROADMAP_ENDPOINTS.CREATE, {
        method: "POST",
        body: roadmapPayload,
      });

      const roadmapData = await roadmapResponse.json();
      
      if (!roadmapData.roadmap_id) {
        console.error("Unexpected response:", roadmapData);
        setError("Failed to create roadmap");
        return;
      }

      let assignmentResults = null;

      // Step 2: Create assignments if needed
      if (showAssignmentSection && assignTo.length > 0) {
        try {
          const assignmentPayload = {
            roadmap_id: roadmapData.roadmap_id,
            assigned_to: assignTo,
            due_date: dueDate || undefined,
          };

          const assignmentResponse = await makeAuthenticatedRequest(ASSIGNMENT_ENDPOINTS.CREATE, {
            method: "POST",
            body: assignmentPayload,
          });

          if (assignmentResponse.ok) {
            assignmentResults = await assignmentResponse.json();
            console.log("Assignment results:", assignmentResults);

            // Show assignment success message
            const successCount = assignmentResults.successful_assignments?.length || 0;
            const failCount = assignmentResults.failed_assignments?.length || 0;
            
            if (successCount > 0 || failCount > 0) {
              const message = failCount > 0 ? 
                `Roadmap created! Assigned to ${successCount} employees successfully. ${failCount} assignments failed.` :
                `Roadmap created and assigned to ${successCount} employee${successCount > 1 ? 's' : ''} successfully!`;
              setAssignmentMessage(message);
              setAssignmentToastOpen(true);
            }
          } else {
            console.error("Assignment failed:", await assignmentResponse.json());
            setAssignmentMessage("Roadmap created but assignment failed. You can assign it manually later.");
            setAssignmentToastOpen(true);
          }
        } catch (assignmentError) {
          console.error("Error creating assignments:", assignmentError);
          setAssignmentMessage("Roadmap created but assignment failed. You can assign it manually later.");
          setAssignmentToastOpen(true);
        }
      }

      navigate(`/roadmap/${roadmapData.roadmap_id}`);
      
    } catch (error) {
      console.error("Error submitting roadmap:", error);
      setError("Failed to create roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty input
    if (raw === "") {
      setHours("");
      return;
    }

    // Allow only digits
    if (!/^\d+$/.test(raw)) return;

    const value = parseInt(raw, 10);

    if (value > 168) {
      setToastOpen(true);
      return;
    }

    setHours(value);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const value =
      raw === "" ? "" : Math.max(0, Math.min(59, parseInt(raw, 10)));
    setMinutes(value);
  };

  return (
    <div className="roadmap-container">
      <Container maxWidth="sm">
        <Paper elevation={4} className="roadmap-form-paper">
          <div className="roadmap-header">
            <Typography variant="h4" component="h1">
              Roadmap Builder
            </Typography>
          </div>

          <div className="roadmap-form-content">
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            >
              {/* Topics Selection */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Select Learning Topics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose from suggested topics or type your own. Our AI will create a personalized roadmap for any learning topic!
                </Typography>
                <Autocomplete
                  multiple
                  freeSolo
                  options={getAllTopics()}
                  value={selectedTopics}
                  onChange={(event, newValue) => {
                    // Process the values to handle both selections and custom input
                    const processedTopics = newValue.map(topic => {
                      // If it's an "Add" suggestion, extract the actual value
                      if (typeof topic === 'string' && topic.startsWith('Add "') && topic.endsWith('"')) {
                        return topic.slice(5, -1); // Remove 'Add "' and '"'
                      }
                      return topic;
                    }).filter(topic => topic && topic.toString().trim().length >= 2) // Basic validation: at least 2 chars
                      .map(topic => topic.toString().trim());
                    
                    setSelectedTopics(processedTopics);
                  }}
                  filterOptions={(options, params) => {
                    const inputValue = params.inputValue.trim();
                    
                    // Get intelligent suggestions based on input and existing topics
                    const suggestions = getTopicSuggestions(inputValue, selectedTopics);
                    
                    // If user typed something not in suggestions and it's valid, show "Add" option
                    if (inputValue.length >= 2 && 
                        !suggestions.some(option => option.toLowerCase() === inputValue.toLowerCase()) &&
                        !selectedTopics.some(selected => selected.toLowerCase() === inputValue.toLowerCase())) {
                      return [...suggestions, `Add "${inputValue}"`];
                    }
                    
                    return suggestions;
                  }}
                  className="topics-autocomplete"
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Choose or type your learning interests" 
                      placeholder="e.g., Python, Machine Learning, Data Science, Web Development" 
                      helperText="Type any topic you want to learn. We'll suggest related topics from our knowledge base or create a custom roadmap for your input (min 2 characters)"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      
                      // Check if this is a predefined topic or custom topic
                      const isCustomTopic = !getAllTopics().some(predefined => 
                        predefined.toLowerCase() === option.toLowerCase()
                      );
                      
                      return (
                        <Chip
                          key={key}
                          label={option}
                          {...tagProps}
                          sx={{
                            background: isCustomTopic 
                              ? "linear-gradient(135deg, #6a1b9a 0%, #8e24aa 100%)" 
                              : "linear-gradient(135deg, #a01441 0%, #c8185a 100%)",
                            color: "white",
                            borderRadius: "16px",
                            fontWeight: 600,
                            "& .MuiChip-deleteIcon": {
                              color: "rgba(255, 255, 255, 0.8)",
                              "&:hover": {
                                color: "white",
                              },
                            },
                          }}
                        />
                      );
                    })
                  }
                  groupBy={(option) => {
                    // Group suggestions by category for better organization
                    if (typeof option === 'string' && option.startsWith('Add "')) {
                      return "Custom Topic";
                    }
                    
                    const category = Object.entries(topicCategories).find(([_, topics]) => 
                      topics.includes(option)
                    );
                    
                    return category ? category[0] : "Other";
                  }}
                />
                
                {/* Show contextual suggestions when topics are selected */}
                {selectedTopics.length > 0 && getContextualSuggestions(selectedTopics, getAllTopics()).length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      You might also be interested in:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {getContextualSuggestions(selectedTopics, getAllTopics()).slice(0, 6).map((suggestion) => (
                        <Chip
                          key={suggestion}
                          label={suggestion}
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            if (!selectedTopics.includes(suggestion)) {
                              setSelectedTopics([...selectedTopics, suggestion]);
                            }
                          }}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'rgba(160, 20, 65, 0.1)',
                              borderColor: '#a01441',
                            },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Skill Level */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Current Skill Level
                </Typography>
                <RadioGroup
                  row
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="skill-level-group"
                >
                  <FormControlLabel 
                    value="basic" 
                    control={<Radio />} 
                    label="Beginner" 
                  />
                  <FormControlLabel
                    value="intermediate"
                    control={<Radio />}
                    label="Intermediate"
                  />
                  <FormControlLabel
                    value="advanced"
                    control={<Radio />}
                    label="Advanced"
                  />
                </RadioGroup>
              </Box>

              {/* Duration */}
              <Box className="form-section">
                <Typography variant="h6" className="form-section-title">
                  Study Duration
                </Typography>
                <Stack direction="row" spacing={2} className="duration-inputs">
                  <TextField
                    label="Hours"
                    type="number"
                    value={hours === "" ? "" : Number(hours)}
                    onChange={handleHoursChange}
                    inputProps={{ min: 0, max: 168 }}
                    fullWidth
                    helperText="Hours per week"
                  />
                  <TextField
                    label="Minutes"
                    type="number"
                    value={minutes === "" ? "" : Number(minutes)}
                    onChange={handleMinutesChange}
                    inputProps={{ min: 0, max: 59 }}
                    fullWidth
                    helperText="Additional minutes"
                  />
                </Stack>
              </Box>

              {/* Assignment Section - Only for Managers and Super Admins */}
              {showAssignmentSection && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box className="form-section">
                    <Typography variant="h6" className="form-section-title">
                      Assignment (Optional)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Assign this roadmap to employees under your management
                    </Typography>
                    
                    {/* Employee Selection */}
                    <Autocomplete
                      multiple
                      options={employees}
                      value={employees.filter(emp => assignTo.includes(emp.id))}
                      onChange={(event, newValue) => {
                        setAssignTo(newValue.map(emp => emp.id));
                      }}
                      getOptionLabel={(option) => `${option.name} (${option.email})`}
                      loading={employeesLoading}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Assign to employees" 
                          placeholder="Select employees to assign this roadmap"
                          helperText="Choose employees who will receive this roadmap assignment"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {employeesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...tagProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option.name}
                              {...tagProps}
                              sx={{
                                background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                                color: "white",
                                borderRadius: "16px",
                                fontWeight: 600,
                                "& .MuiChip-deleteIcon": {
                                  color: "rgba(255, 255, 255, 0.8)",
                                  "&:hover": {
                                    color: "white",
                                  },
                                },
                              }}
                            />
                          );
                        })
                      }
                    />
                    
                    {/* Due Date (Optional) */}
                    {assignTo.length > 0 && (
                      <TextField
                        label="Due Date (Optional)"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        helperText="Set a due date for the assigned roadmap"
                        sx={{ mt: 2 }}
                        fullWidth
                      />
                    )}
                  </Box>
                </>
              )}

              {/* Submit Button */}
              <Button 
                variant="contained" 
                type="submit" 
                disabled={loading || !isFormValid}
                className="submit-button"
                size="large"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                    {assignTo.length > 0 ? "Creating & Assigning Roadmap..." : "Creating Your Roadmap..."}
                  </>
                ) : (
                  assignTo.length > 0 ? 
                    `Create & Assign to ${assignTo.length} Employee${assignTo.length > 1 ? 's' : ''}` :
                    "Create My Learning Roadmap"
                )}
              </Button>

              {loading && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Generating personalized learning path...
                  </Typography>
                </Box>
              )}
            </Box>
          </div>

          <Snackbar
            open={toastOpen}
            autoHideDuration={4000}
            onClose={() => setToastOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            className="warning-snackbar"
          >
            <Alert
              severity="warning"
              onClose={() => setToastOpen(false)}
              sx={{ width: "100%" }}
            >
              Please limit the time to less than 168 hours for efficient learning.
            </Alert>
          </Snackbar>

          <Snackbar
            open={assignmentToastOpen}
            autoHideDuration={6000}
            onClose={() => setAssignmentToastOpen(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              severity="success"
              onClose={() => setAssignmentToastOpen(false)}
              sx={{ width: "100%" }}
            >
              {assignmentMessage}
            </Alert>
          </Snackbar>
        </Paper>
      </Container>
    </div>
  );
};

export default RoadmapScreen;
