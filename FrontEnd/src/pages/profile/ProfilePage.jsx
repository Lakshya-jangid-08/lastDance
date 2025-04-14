import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfileCard from '../../components/profile/ProfileCard';
import { ClipboardList, Users } from 'lucide-react';

const ProfilePage = () => {
  const [accountStats, setAccountStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    joinedDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        // Get user surveys
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/surveys/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Get user profile for joined date
        const profileResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/auth/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const surveyData = response.data;
        
        // Calculate stats
        setAccountStats({
          totalSurveys: surveyData.length,
          totalResponses: surveyData.reduce((sum, survey) => sum + (survey.responses_count || 0), 0),
          joinedDate: new Date(profileResponse.data.date_joined || Date.now()).toLocaleDateString()
        });
        
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError('Failed to load account activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account information
          </p>
        </div>
        
        <div className="mb-10">
          <ProfileCard />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Account Activity</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Surveys</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : accountStats.totalSurveys}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Responses</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {loading ? '...' : accountStats.totalResponses}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-700">{error}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
