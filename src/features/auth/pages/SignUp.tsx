import { TextField, Button, Typography, Box, Link, CircularProgress} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SignUp.css";

const SignUpPage: React.FC = () => {
  const [name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false); 
  const [errorMessage, setErrorMessage] = useState(""); 
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        confirmPassword,
      });
      console.log("Register success:", res.data);

      navigate("/login");
    } catch (err: any) {
      console.error("Register error:", err);
      setErrorMessage(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="signup-container">
      <Box className="signup-form-card">
        <Typography variant="h4" className="signup-title">
          SIGNUP
        </Typography>

        <Typography variant="body1" className="signup-description">
          To access our learning platform, please enter your credentials below.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className="signup-form">
          <TextField
            label="Full Name"
            fullWidth
            value={name}
            onChange={(e) => setFullName(e.target.value)}
            className="signup-name-field"
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="signup-email-field"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signup-password-field"
          />
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="signup-confirm-password-field"
          />

          <Button
            variant="contained"
            size="large"
            type="submit"
            fullWidth
            className="signup-submit-button"
            disabled={loading}
            sx={{ position: "relative" }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                sx={{
                  color: "white",
                }}
              />
            ) : (
              "Create Account"
            )}
          </Button>
        </Box>

        {errorMessage && (
          <Typography
            sx={{ mt: 2, textAlign: "center", color: "red", fontWeight: 600 }}
          >
            {errorMessage}
          </Typography>
        )}

        <Typography
          variant="body2"
          className="signup-bottom-text"
          sx={{ mt: 2 }}
        >
          Already have an account?{" "}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/login")}
            className="signup-signin-link"
          >
            Sign in here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignUpPage;
