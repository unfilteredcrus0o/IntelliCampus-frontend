import { TextField, Button, Typography, Box, Link, CircularProgress} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAndStoreUserProfile } from "../../../utils/api";
import "./SignIn.css";

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Error message
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

    
      if (res.data.token) {
        sessionStorage.setItem("authToken", res.data.token);
      } else if (res.data.access_token) {
        sessionStorage.setItem("authToken", res.data.access_token);
      }

      const userName = email.split("@")[0];
      sessionStorage.setItem("user", JSON.stringify({ name: userName, email }));
      sessionStorage.setItem("isAuthenticated", "true");

      // Fetch user profile including role
      const profileFetched = await fetchAndStoreUserProfile();
      
      if (profileFetched) {
        // Navigate to dashboard to trigger role-based routing
        navigate("/dashboard");
      } else {
        // Fallback to home if profile fetch fails
        navigate("/");
      } 
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage(
        `${
          err.response?.data?.message ||
          "Invalid credentials, please try again❗ "
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="signin-container">
      <Box className="signin-form-card">
        <Typography variant="h4" className="signin-title">
          LOGIN
        </Typography>

        <Typography variant="body2" className="signin-description">
          Sign in with Email and Password
        </Typography>

        <Box component="form" onSubmit={handleSubmit} className="signin-form">
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="signin-email-field"
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signin-password-field"
          />
          <Button
            variant="contained"
            size="large"
            type="submit"
            fullWidth
            className="signin-submit-button"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: "#fff" }} />
            ) : (
              "Sign In"
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
          className="signin-bottom-text"
          sx={{ mt: 2 }}
        >
          Don't have an account?{" "}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate("/signup")}
            className="signin-signup-link"
          >
            Sign up here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default SignInPage;
