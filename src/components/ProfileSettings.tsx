import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  PhotoCamera,
  Upload,
  Person,
  Email,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { makeAuthenticatedRequest, getCurrentUser } from '../utils/api';

interface UserProfile {
  name: string;
  email: string;
  role?: string;
  image_url?: string;
}

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser() as UserProfile | null;
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.image_url) {
        setPreviewUrl(currentUser.image_url);
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (32MB max for ImgBB)
      if (file.size > 32 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 32MB' });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select an image file' });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image to ImgBB');
    }

    const data = await response.json();
    return data.data.url;
  };

  const updateUserProfile = async (imageUrl: string): Promise<void> => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/user`, {
      method: 'PUT',
      body: { image_url: imageUrl },
    });

    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }

    return response.json();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Please select an image first' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to ImgBB
      const imageUrl = await uploadToImgBB(selectedFile);
      
      // Update user profile
      await updateUserProfile(imageUrl);

      // Update local state and session storage
      const updatedUser = { ...user, image_url: imageUrl };
      setUser(updatedUser as UserProfile);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      setUploadProgress(100);
      setMessage({ type: 'success', text: 'Profile image updated successfully!' });
      setSelectedFile(null);

      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload image' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setUploading(true);
      
      // Update user profile to remove image
      await updateUserProfile('');

      // Update local state and session storage
      const updatedUser = { ...user, image_url: '' };
      setUser(updatedUser as UserProfile);
      sessionStorage.setItem('user', JSON.stringify(updatedUser));

      setPreviewUrl('');
      setSelectedFile(null);
      setMessage({ type: 'success', text: 'Profile image removed successfully!' });

    } catch (error) {
      console.error('Failed to remove image:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to remove profile image' 
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#1a1a1a" }}>
            Profile Settings
          </Typography>

          <Divider sx={{ mb: 4 }} />

          {/* Profile Image Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: "#1a1a1a" }}>
              Profile Image
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                src={previewUrl || user.image_url}
                sx={{ 
                  width: 120, 
                  height: 120,
                  fontSize: '3rem',
                  bgcolor: '#f5f5f5',
                  color: '#333',
                  border: '3px solid #e0e0e0'
                }}
              >
                {!previewUrl && !user.image_url && user.name.charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ mb: 2, color: '#666' }}>
                  Upload a profile image to personalize your account. 
                  Supported formats: JPG, PNG, GIF (max 32MB)
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    sx={{
                      borderColor: '#e0e0e0',
                      color: '#333',
                      '&:hover': {
                        borderColor: '#333',
                        bgcolor: '#f5f5f5'
                      }
                    }}
                  >
                    Select Image
                  </Button>

                  {selectedFile && (
                    <Button
                      variant="contained"
                      startIcon={uploading ? <CircularProgress size={16} /> : <Upload />}
                      onClick={handleUpload}
                      disabled={uploading}
                      sx={{
                        bgcolor: '#333',
                        '&:hover': {
                          bgcolor: '#1a1a1a'
                        }
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  )}

                  {(user.image_url || previewUrl) && !selectedFile && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveImage}
                      disabled={uploading}
                    >
                      Remove Image
                    </Button>
                  )}
                </Box>

                {/* Upload Progress */}
                {uploading && uploadProgress > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      Uploading... {uploadProgress}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#333'
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Selected file info */}
                {selectedFile && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#333' }}>
                      Selected: {selectedFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* User Information */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: "#1a1a1a" }}>
              Account Information
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Person sx={{ color: '#666' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                    Full Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                    {user.name}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Email sx={{ color: '#666' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#333' }}>
                    {user.email}
                  </Typography>
                </Box>
              </Box>

              {user.role && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Person sx={{ color: '#666' }} />
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', fontSize: '0.875rem' }}>
                      Role
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: '#333', textTransform: 'capitalize' }}>
                      {user.role}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      <Snackbar
        open={Boolean(message)}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMessage(null)}
          severity={message?.type}
          variant="filled"
          icon={message?.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
          sx={{ borderRadius: 2 }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfileSettings;
