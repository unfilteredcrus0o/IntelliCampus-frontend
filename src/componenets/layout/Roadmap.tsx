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
  Divider,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  Avatar,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from "@mui/material";
import RoadmapIcon from '../../assets/svgIcons/RoadmapIcon';
import TopicIcon from '../../assets/svgIcons/TopicIcon';
import HoursIcon from '../../assets/svgIcons/HoursIcon';
import SkillIcon from '../../assets/svgIcons/SkillIcon';
import AssignmentIcon from '../../assets/svgIcons/AssignmentIcon';
import CreateRoadmapIcon from '../../assets/svgIcons/CreateRoadmapIcon';

import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest, getCurrentUserRole } from "../../utils/api";
import * as Constants from "../../constants";

// Define a consistent dark red color
const darkRed = '#a01441';

const topicsList = ["Python", "Git", "JavaScript", "React", "CSS", "Machine Learning", "Data Science", "Web Development", "Mobile Development", "DevOps", "Cloud Computing", "Artificial Intelligence", "Database Management", "Cybersecurity", "UI/UX Design"];

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

const getAllTopics = () => {
  return Array.from(new Set([...topicsList, ...Object.values(topicCategories).flat()]));
};

const getTopicSuggestions = (inputValue: string, selectedTopics: string[]) => {
  const allTopics = getAllTopics();
  const input = inputValue.toLowerCase();
  
  if (!input) return allTopics.filter(topic => !selectedTopics.includes(topic)).slice(0, 10);
  
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

const getContextualSuggestions = (selectedTopics: string[]) => {
  if (selectedTopics.length === 0) return [];
  
  const relatedTopics = new Set<string>();
  
  selectedTopics.forEach(selectedTopic => {
    Object.entries(topicCategories).forEach(([, topics]) => {
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
  const [, setError] = useState<string | null>(null);
  const [assignmentToastOpen, setAssignmentToastOpen] = useState(false);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  
  const [assignTo, setAssignTo] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [showAssignmentSection, setShowAssignmentSection] = useState(false);
  
  const { ROADMAP_ENDPOINTS, USER_ENDPOINTS, ASSIGNMENT_ENDPOINTS } = Constants;
  const navigate = useNavigate();
  const userRole = getCurrentUserRole();

  useEffect(() => {
    if (userRole === "manager" || userRole === "superadmin") {
      setShowAssignmentSection(true);
      fetchEmployees();
    }
  }, [userRole]);

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const allUsers = [];
      const employeePromise = makeAuthenticatedRequest(
        USER_ENDPOINTS.GET_EMPLOYEES,
        { method: "GET" }
      );
      const managerPromise =
        userRole === "superadmin"
          ? makeAuthenticatedRequest(USER_ENDPOINTS.GET_MANAGERS, { method: "GET" })
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

  const isFormValid = selectedTopics.length > 0 && skillLevel !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const totalMinutes = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    const formattedDuration = totalMinutes > 0 
      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
      : "Self-paced";

    const roadmapPayload = {
      selectedTopics,
      skillLevel,
      duration: formattedDuration,
      title: `${selectedTopics.join(", ")} Learning Roadmap`,
    };

    try {
      const roadmapResponse = await makeAuthenticatedRequest(ROADMAP_ENDPOINTS.CREATE, {
        method: "POST",
        body: roadmapPayload,
      });

      const roadmapData = await roadmapResponse.json();
      
      if (!roadmapData.roadmap_id) {
        let errorToBeShown = "Failed to create roadmap";
        if(roadmapData?.detail?.error && roadmapData?.detail?.invalid_topics?.length){
          console.error("Unrecognized topic: ", roadmapData?.detail?.error);
          errorToBeShown = roadmapData?.detail?.error;
        }
        console.error("Unexpected response:", roadmapData);
        setError(errorToBeShown);
        return;
      }

      let assignmentResults = null;

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

      if (
        userRole === "manager" ||
        (userRole === "superadmin" && assignTo.length)
      ) {
        navigate("/dashboard");
      } else {
        navigate(`/roadmap/${roadmapData.roadmap_id}`);
      }
      
    } catch (error) {
      console.error("Error submitting roadmap:", error);
      setError("Failed to create roadmap");
    } finally {
      setLoading(false);
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setHours("");
      return;
    }
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
    const value = raw === "" ? "" : Math.max(0, Math.min(59, parseInt(raw, 10)));
    setMinutes(value);
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        py: 4, 
        background: `radial-gradient(circle, #fcf4f4, #f0e6e6)`, 
        minHeight: '100vh',
        transition: 'background 0.5s ease-in-out'
      }}
    >
      <Paper elevation={8} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ color: darkRed }}>
              <RoadmapIcon fontSize="large" sx={{ color: darkRed }} />
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 700, color: darkRed }}
              style={{fontSize: '24px', fontStretch: 'expanded'}}
            >
              Create a New Learning Roadmap
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary" style={{marginTop: '16px'}}>
            Generate a personalized, step-by-step learning path with our AI-powered builder.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          
          {/* Topics Selection Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color: darkRed }}>
                 <TopicIcon fontSize="large" sx={{ color: darkRed }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Select Learning Topics
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              What do you want to learn? Our AI will create a personalized roadmap based on your interests.
            </Typography>
               <Autocomplete
                  multiple
                  freeSolo
                  options={getAllTopics()}
                  value={selectedTopics}
                  onChange={(event, newValue) => {
                     if (!newValue?.length) {
                       setError(null);
                     }
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
  sx={{
    '& label': {
      color: '#a01441', // dark red
    },
    '& label.Mui-focused': {
      color: '#a01441',
    },
    '.MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: '#ccc',
      },
      '&:hover fieldset': {
        borderColor: '#a01441',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#a01441',
      },
    },
    input: {
      color: '#000',
    }
  }}

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
            
            {/* Contextual Suggestions Chips */}
            {selectedTopics.length > 0 && getContextualSuggestions(selectedTopics).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  You might also be interested in:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {getContextualSuggestions(selectedTopics).slice(0, 6).map((suggestion) => (
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
                        color: darkRed, 
                        borderColor: darkRed,
                        transition: 'background-color 0.3s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(160, 20, 65, 0.1)',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
          
          <Divider sx={{ my: 2 }} />

          {/* Skill Level Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color: darkRed }}>
                 <SkillIcon fontSize="large" sx={{ color: darkRed }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Current Skill Level
              </Typography>
            </Stack>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              >
                <FormControlLabel 
                  value="basic" 
                  control={<Radio sx={{ color: darkRed, '&.Mui-checked': { color: darkRed } }} />} 
                  label="Beginner" 
                />
                <FormControlLabel 
                  value="intermediate" 
                  control={<Radio sx={{ color: darkRed, '&.Mui-checked': { color: darkRed } }} />} 
                  label="Intermediate" 
                />
                <FormControlLabel 
                  value="advanced" 
                  control={<Radio sx={{ color: darkRed, '&.Mui-checked': { color: darkRed } }} />} 
                  label="Advanced" 
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Duration Section */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color: darkRed }}>
              <Typography fontSize="small" sx={{ lineHeight: 1.5, color: darkRed }}>
                <HoursIcon fontSize="small" sx={{ color: darkRed }} />
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Study Duration (Optional)
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set your preferred study time per week, or leave blank for self-paced learning.
            </Typography>
            <Grid container spacing={2}>
              <Grid component={Box}>
                <TextField
                  label="Hours"
                  type="number"
                  value={hours === "" ? "" : Number(hours)}
                  onChange={handleHoursChange}
                  fullWidth
                  inputProps={{ min: 0, max: 168 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: darkRed }}>⌛</Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '.MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.3s ease-in-out',
                      '&:hover fieldset': {
                        borderColor: darkRed,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: darkRed,
                      }
                    }
                  }}
                />
              </Grid>
              <Grid component={Box}>
                <TextField
                  label="Minutes"
                  type="number"
                  value={minutes === "" ? "" : Number(minutes)}
                  onChange={handleMinutesChange}
                  fullWidth
                  inputProps={{ min: 0, max: 59 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ color: darkRed }}>⏲️</Typography>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '.MuiOutlinedInput-root': {
                      transition: 'box-shadow 0.3s ease-in-out',
                      '&:hover fieldset': {
                        borderColor: darkRed,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: darkRed,
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Assignment Section */}
          {showAssignmentSection && (
            <Card variant="outlined" sx={{ my: 3, borderLeft: '4px solid', borderColor: darkRed, borderRadius: 2 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1, color: darkRed }}>
                      <AssignmentIcon fontSize="small" sx={{ color: darkRed }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Assignment (Optional)
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Assign this roadmap to employees under your management.
                </Typography>
                
                <Autocomplete
                  multiple                  
                  options={employees}
                  value={employees.filter(emp => assignTo.includes(emp.id))}
                  onChange={(event, newValue) => setAssignTo(newValue.map(emp => emp.id))}
                  getOptionLabel={(option) => `${option.name} (${option.email})`}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  loading={employeesLoading}
                 renderInput={(params) => (
  <TextField 
    {...params} 
    label="Assign to employees" 
    placeholder="Select employees to assign"
    InputProps={{
      ...params.InputProps,
      endAdornment: (
        <>
          {employeesLoading ? <CircularProgress color="inherit" size={20} /> : null}
          {params.InputProps.endAdornment}
        </>
      ),
    }}
    sx={{
      '& label': {
        color: '#a01441',
      },
      '& label.Mui-focused': {
        color: '#a01441',
      },
      '.MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#ccc',
        },
        '&:hover fieldset': {
          borderColor: '#a01441',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#a01441',
        },
      },
      input: {
        color: '#000', 
      }
    }}
  />
)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={index}
                        label={option.name}
                        {...getTagProps({ index })}
                        variant="filled"
                        sx={{ 
                          background: darkRed, 
                          color: 'white', 
                          borderRadius: "8px", 
                          fontWeight: 500,
                          transition: 'background-color 0.3s ease-in-out',
                          '&:hover': {
                            backgroundColor: '#8a113a'
                          }
                        }}
                        avatar={<Avatar sx={{ bgcolor: darkRed }}><Typography sx={{ color: 'white' }}>👤</Typography></Avatar>}
                      />
                    ))
                  }
                  renderOption={(props, option) => (
                    <ListItem 
                      {...props} 
                      key={option.id}
                      sx={{ 
                        transition: 'background-color 0.3s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(160, 20, 65, 0.1)',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: darkRed }}><Typography sx={{ color: 'white' }}>👤</Typography></Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={option.name}
                        secondary={option.email}
                      />
                    </ListItem>
                  )}
                />
                
                {assignTo.length > 0 && (
                  <TextField
                    label="Due Date (Optional)"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Set a due date for the assigned roadmap"
                    sx={{ 
                      mt: 2, 
                      '.MuiOutlinedInput-root': {
                        transition: 'box-shadow 0.3s ease-in-out',
                        '&:hover fieldset': {
                          borderColor: darkRed,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: darkRed,
                        }
                      }
                    }}
                    fullWidth
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button 
            variant="contained" 
            size="large"
            type="submit" 
            disabled={loading || !isFormValid}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Typography sx={{ color: 'white' }}> <CreateRoadmapIcon fontSize="large" sx={{ color: darkRed }} /></Typography>}
            sx={{ 
              mt: 2, 
              py: 1.5, 
              fontWeight: 600, 
              borderRadius: 2, 
              backgroundColor: darkRed, 
              transition: 'background-color 0.3s ease-in-out',
              '&:hover': { 
                backgroundColor: '#8a113a' 
              } 
            }}
          >
            {loading ? (
              assignTo.length > 0 ? "Creating & Assigning..." : "Generating Your Roadmap..."
            ) : (
              assignTo.length > 0 ? 
                `Create & Assign to ${assignTo.length} Employee${assignTo.length > 1 ? 's' : ''}` :
                "Create My Learning Roadmap"
            )}
          </Button>

          {/* Loading Text */}
          {loading && (
            <Box sx={{ textAlign: "center", mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                This may take a moment. We're generating your personalized learning path.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      
      {/* Toast notifications */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
          sx={{ width: "100%", backgroundColor: darkRed, color: 'white' }}
        >
          {assignmentMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoadmapScreen;