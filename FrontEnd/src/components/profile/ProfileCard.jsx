import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from 'lucide-react';

const ProfileCard = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    organization: { name: '' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('No authorization token found');
          setLoading(false);
          return;
        }

        // Using the correct API endpoint path
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Profile API response:', response.data);

        setProfile({
          username: response.data.username || '',
          email: response.data.email || '',
          organization: response.data.profile?.organization || { name: 'Not affiliated with any organization' }
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        
        if (err.response) {
          console.error('Error status:', err.response.status);
          console.error('Error data:', err.response.data);
        }
        
        setError('Failed to load profile information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="rounded-full bg-gray-200 h-24 w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
          <div className="h-4 bg-gray-200 rounded w-36"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden max-w-md mx-auto transition-all duration-300 hover:shadow-md">
      {/* Header with accent color */}
      <div className="bg-indigo-100 h-24"></div>
      
      {/* Profile content */}
      <div className="relative px-6 py-8">
        {/* Avatar */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full p-2 shadow-md">
            <div className="bg-indigo-100 rounded-full p-4 flex items-center justify-center">
              <User className="h-12 w-12 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* User information */}
        <div className="pt-10 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">{profile.username}</h2>
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Email Address</p>
              <p className="text-gray-800">{profile.email}</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Organization</p>
              <p className="text-gray-800">{profile.organization?.name || "Not affiliated with any organization"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
