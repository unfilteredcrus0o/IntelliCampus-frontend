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
  Card,
  CardContent,
  Avatar,
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
  const [dateError, setDateError] = useState<string | null>(null);
  
  // Date-related state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
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

  // Date validation effect
  useEffect(() => {
    if (!startDate || !endDate) {
      setDateError(null);
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setDateError("End date cannot be before start date");
    } else {
      setDateError(null);
    }
  }, [startDate, endDate]);

  // Simple validation function that doesn't update state
  const isDateValid = () => {
    if (!startDate || !endDate) return true;
    return new Date(endDate) >= new Date(startDate);
  };

  const isFormValid =
  selectedTopics.length > 0 &&
  skillLevel !== "" &&
  isDateValid();


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
      ...(showAssignmentSection && startDate && { start_date: startDate }),
      ...(showAssignmentSection && endDate && { end_date: endDate }),
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
      <Container maxWidth="lg">
         <Box sx={{ 
           display: "flex", 
           gap: 3, 
           minHeight: "auto",
           flexDirection: { xs: "column", md: "row" }
         }}>
           {/* Left Panel - Configuration Form */}
           <Box sx={{ flex: 2 }}>
             <Paper 
               elevation={0} 
               sx={{ 
                 p: 3, 
                 borderRadius: 3,
                 background: "rgb(240,240,242)",
                 boxShadow: `
                   8px 8px 16px rgba(163, 177, 198, 0.6),
                   -8px -8px 16px rgba(255, 255, 255, 0.8)
                 `,
                 border: "none"
               }}
             >
               <Typography 
                 variant="h6" 
                 sx={{ 
                   fontWeight: 600, 
                   color: "#2c3e50", 
                   mb: 3,
                   fontSize: "1.3rem"
                 }}
               >
                 Configure Your Roadmap
               </Typography>


            <Box
              component="form"
              onSubmit={handleSubmit}
                 sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
            >

              {/* Topics Selection */}
                 <Box>
                   <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                     <img 
                       src="https://cdn-icons-png.flaticon.com/512/3145/3145765.png" 
                       alt="Topics"
                       style={{ width: '20px', height: '20px' }}
                     />
                     <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "1rem" }}>
                       Learning Topics
                </Typography>
                   </Box>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                     Select learning topics
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
                 <Box>
                   <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                     <img 
                       src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
                       alt="Skill Level"
                       style={{ width: '20px', height: '20px' }}
                     />
                     <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "1rem" }}>
                       Skill Level
                </Typography>
                   </Box>
                <RadioGroup
                  row
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                    sx={{ gap: 2 }}
                >
                  <FormControlLabel 
                    value="basic" 
                      control={<Radio sx={{ color: "#4a90e2", "&.Mui-checked": { color: "#4a90e2" } }} />} 
                    label="Beginner" 
                      sx={{ 
                        "& .MuiFormControlLabel-label": { 
                          fontSize: "0.95rem",
                          fontWeight: 500
                        }
                      }}
                  />
                  <FormControlLabel
                    value="intermediate"
                      control={<Radio sx={{ color: "#4a90e2", "&.Mui-checked": { color: "#4a90e2" } }} />}
                    label="Intermediate"
                      sx={{ 
                        "& .MuiFormControlLabel-label": { 
                          fontSize: "0.95rem",
                          fontWeight: 500
                        }
                      }}
                  />
                  <FormControlLabel
                    value="advanced"
                      control={<Radio sx={{ color: "#4a90e2", "&.Mui-checked": { color: "#4a90e2" } }} />}
                    label="Advanced"
                      sx={{ 
                        "& .MuiFormControlLabel-label": { 
                          fontSize: "0.95rem",
                          fontWeight: 500
                        }
                      }}
                  />
                </RadioGroup>
              </Box>

              {/* Duration */}
                 <Box>
                   <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                     <img 
                       src="https://cdn-icons-png.flaticon.com/512/2784/2784459.png" 
                       alt="Duration"
                       style={{ width: '20px', height: '20px' }}
                     />
                     <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "1rem" }}>
                  Study Duration (Optional)
                </Typography>
                   </Box>
                   <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Set your preferred study time per week, or leave blank for self-paced learning.
                </Typography>
                  <Stack direction="row" spacing={2}>
                  <TextField
                    label="Hours"
                    type="number"
                    value={hours === "" ? "" : Number(hours)}
                    onChange={handleHoursChange}
                    inputProps={{ min: 0, max: 168 }}
                    fullWidth
                    helperText="Hours per week"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                  />
                  <TextField
                    label="Minutes"
                    type="number"
                    value={minutes === "" ? "" : Number(minutes)}
                    onChange={handleMinutesChange}
                    inputProps={{ min: 0, max: 59 }}
                    fullWidth
                    helperText="Additional minutes"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                  />
                </Stack>
              </Box>

              {/* Roadmap Timeline - Only for Managers and Super Admins */}
              {showAssignmentSection && (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/2693/2693507.png" 
                      alt="Timeline"
                      style={{ width: '20px', height: '20px' }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "1rem" }}>
                      Roadmap Timeline (Optional)
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Set start and end dates for the roadmap timeline.
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label="Start Date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!dateError}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        min: startDate || undefined,
                      }}
                      error={!!dateError}
                      helperText={dateError}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Stack>
                </Box>
              )}

              {/* Assignment Section - Only for Managers and Super Admins */}
              {showAssignmentSection && (
                   <Box>
                     <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                       <img 
                         src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png" 
                         alt="Assign"
                         style={{ width: '20px', height: '20px' }}
                       />
                       <Typography variant="h6" sx={{ fontWeight: 600, color: "#2c3e50", fontSize: "1rem" }}>
                         Assign To
                    </Typography>
                     </Box>
                     <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                       Select employees
                    </Typography>
                    
                    <Autocomplete
                      multiple
                      options={employees}
                      value={employees.filter(emp => assignTo.includes(emp.id))}
                      onChange={(event, newValue) => {
                        setAssignTo(newValue.map(emp => emp.id));
                      }}
                      getOptionLabel={(option) => option.name}
                      loading={employeesLoading}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          placeholder="Select employees"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: 2,
                            }
                          }}
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
                    />
                  </Box>
                )}

              </Box>
            </Paper>
          </Box>

           {/* Right Panel - Roadmap Summary */}
           <Box sx={{ flex: 1, maxWidth: "350px" }}>
             <Paper 
               elevation={0} 
               sx={{ 
                 p: 3, 
                 borderRadius: 3,
                 background: "rgb(240,240,242)",
                 boxShadow: `
                   8px 8px 16px rgba(163, 177, 198, 0.6),
                   -8px -8px 16px rgba(255, 255, 255, 0.8)
                 `,
                 border: "none"
               }}
             >
               <Typography 
                 variant="h6" 
                              sx={{
                                fontWeight: 600,
                   color: "#2c3e50", 
                   mb: 2,
                   fontSize: "1.2rem"
                 }}
               >
                 Roadmap Summary
               </Typography>
               
               <Typography 
                 variant="body2" 
                 sx={{ 
                   color: "#666", 
                   mb: 3,
                   fontSize: "0.85rem"
                 }}
               >
                 {new Date().toLocaleDateString('en-US', { 
                   weekday: 'long', 
                   month: 'short', 
                   day: 'numeric' 
                 })}
               </Typography>

               {/* Summary Cards */}
               <Stack spacing={2}>
                {/* Timeline Dates - Only show for Managers and Super Admins */}
                {showAssignmentSection && (startDate || endDate) && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        backgroundColor: "#4a90e2", 
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }} 
                    >
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/2693/2693507.png" 
                        alt="Calendar"
                        style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                        Timeline:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                        {startDate && endDate 
                          ? `${new Date(startDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })} - ${new Date(endDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}`
                          : startDate 
                            ? `From ${new Date(startDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}`
                            : endDate
                              ? `Until ${new Date(endDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}`
                              : "Not set"
                        }
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Topics Selected */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: "#27ae60", 
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }} 
                  >
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/3145/3145765.png" 
                      alt="Topics"
                      style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                      Topics Selected:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                      {selectedTopics.length} selected
                    </Typography>
                  </Box>
                </Box>

                {/* Skill Level */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: "#f39c12", 
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }} 
                  >
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
                      alt="Skill Level"
                      style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                      Skill Level:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                      {skillLevel ? skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1) : "Not selected"}
                    </Typography>
                  </Box>
                </Box>

                {/* Study Duration */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: "#e74c3c", 
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }} 
                  >
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/2784/2784459.png" 
                      alt="Clock"
                      style={{ width: '18px', height: '18px', filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                      Study Duration:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                      {hours || minutes ? 
                        `${hours || 0}h ${minutes || 0}m per week` : 
                        "Self-paced"
                      }
                    </Typography>
                  </Box>
                </Box>

                {/* Assign To */}
                {showAssignmentSection && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box 
                      sx={{ 
                        width: 8, 
                        height: 8, 
                        backgroundColor: "#4a90e2", 
                        borderRadius: "50%" 
                      }} 
                    />
                    <Box>
                      <Typography variant="body2" sx={{ color: "#666", fontSize: "0.9rem" }}>
                        Assign To:
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        {assignTo.length > 0 ? (
                          <>
                            <Box 
                              sx={{ 
                                backgroundColor: "#4a90e2", 
                                color: "white", 
                                borderRadius: "50%", 
                                width: 24, 
                                height: 24, 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontSize: "0.75rem", 
                                fontWeight: 600 
                              }}
                            >
                              +{assignTo.length}
                            </Box>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50", ml: 1 }}>
                              {assignTo.length} employee{assignTo.length > 1 ? 's' : ''}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" sx={{ fontWeight: 600, color: "#2c3e50" }}>
                            None selected
                          </Typography>
                        )}
                      </Box>
                      
                      {/* Show selected employee avatars */}
                      {assignTo.length > 0 && assignTo.length <= 6 && (
                        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                          {employees
                            .filter(emp => assignTo.includes(emp.id))
                            .map((employee, index) => (
                              <Box key={employee.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    fontSize: "0.8rem",
                                    backgroundColor: "#4a90e2"
                                  }}
                                >
                                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </Avatar>
                                <Typography variant="caption" sx={{ color: "#666" }}>
                                  {employee.name.split(' ')[0]}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                    )}
                  </Box>
                  </Box>
              )}
              </Stack>

               {/* Create Roadmap Button */}
               <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                  onClick={handleSubmit}
                disabled={loading || !isFormValid}
                  fullWidth
                  size="medium"
                  sx={{
                    backgroundColor: "#4a90e2",
                    borderRadius: 2,
                    py: 1,
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 2px 8px rgba(74, 144, 226, 0.25)",
                    "&:hover": {
                      backgroundColor: "#357abd",
                      boxShadow: "0 3px 12px rgba(74, 144, 226, 0.3)",
                    },
                    "&:disabled": {
                      backgroundColor: "#ccc",
                      boxShadow: "none",
                    }
                  }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      Creating Roadmap...
                  </>
                ) : (
                    "Create Roadmap"
                )}
              </Button>

              {loading && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: "#666", 
                      textAlign: "center", 
                      mt: 2,
                      fontSize: "0.9rem"
                    }}
                  >
                    Generating personalized learning path...
                  </Typography>
              )}
            </Box>
            </Paper>
          </Box>
        </Box>

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
              sx={{ width: "100%" }}
            >
              {assignmentMessage}
            </Alert>
          </Snackbar>
      </Container>
    </div>
  );
};

export default RoadmapScreen;
