import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SurveyResponse = () => {
  const { creatorId, surveyId } = useParams(); // Ensure correct parameter names
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (!creatorId || !surveyId) {
      setError('Invalid survey or creator ID');
      setLoading(false);
      return;
    }
    fetchSurvey();
  }, [creatorId, surveyId]);

  const fetchSurvey = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };

      console.log('Fetching survey with ID:', surveyId);

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/api/surveys/${creatorId}/${surveyId}/`, { headers }); // Use creatorId and survey ID
      
      console.log('Raw survey response:', response.data);

      if (!response.data) {
        throw new Error('No survey data received');
      }

      // Process the survey data to ensure correct field names
      const processedSurvey = {
        ...response.data,
        questions: response.data.questions ? response.data.questions.map(q => ({
          id: q.id,
          text: q.text,
          question_type: q.question_type || 'text',
          required: q.required || false,
          choices: q.choices ? q.choices.map(c => ({
            id: c.id,
            text: c.text
          })) : []
        })) : []
      };

      console.log('Processed survey data:', processedSurvey);
      console.log('Questions:', processedSurvey.questions);

      setSurvey(processedSurvey);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching survey:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setShowLoginPrompt(true);
      }
      setError(error.response?.data?.detail || 'Failed to load survey');
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleChoiceChange = (questionId, choiceId, isMultiple = false) => {
    if (isMultiple) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          choices: prev[questionId]?.choices?.includes(choiceId)
            ? prev[questionId].choices.filter(id => id !== choiceId)
            : [...(prev[questionId]?.choices || []), choiceId]
        }
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          choice: choiceId
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setValidationErrors({});

    try {
      // First, check if all required questions are present in the answers
      const missingRequiredQuestions = survey.questions.filter(question => {
        if (!question.required) return false;
        return !answers.hasOwnProperty(question.id);
      });

      if (missingRequiredQuestions.length > 0) {
        const newValidationErrors = {};
        missingRequiredQuestions.forEach(question => {
          newValidationErrors[question.id] = 'This field is required';
        });
        setValidationErrors(newValidationErrors);
        setSubmitting(false);
        return;
      }

      // Then validate the content of each answer
      const invalidAnswers = survey.questions.filter(question => {
        if (!question.required) return false;
        
        const answer = answers[question.id];
        if (!answer) return true;
        
        if (question.question_type === 'text') {
          return !answer.trim();
        } else if (question.question_type === 'multiple_choice') {
          return !answer.choices || answer.choices.length === 0;
        } else if (question.question_type === 'single_choice') {
          return !answer.choice;
        }
        return false;
      });

      if (invalidAnswers.length > 0) {
        const newValidationErrors = {};
        invalidAnswers.forEach(question => {
          newValidationErrors[question.id] = 'Please provide a valid answer';
        });
        setValidationErrors(newValidationErrors);
        setSubmitting(false);
        return;
      }

      // Format answers for submission
      const formattedAnswers = survey.questions.map(question => {
        const answer = answers[question.id];
        if (!answer) return null;

        const formattedAnswer = {
          question: question.id
        };

        if (question.question_type === 'text') {
          formattedAnswer.text_answer = answer;
        } else if (question.question_type === 'multiple_choice') {
          formattedAnswer.selected_choices = answer.choices;
        } else if (question.question_type === 'single_choice') {
          formattedAnswer.selected_choices = [answer.choice];
        }

        return formattedAnswer;
      }).filter(Boolean);

      const token = localStorage.getItem('access_token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };

      console.log('Submitting answers:', formattedAnswers);

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/survey-responses/`,
        {
          survey: surveyId,
          answers: formattedAnswers
        },
        { headers }
      );

      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting response:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle backend validation errors
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.detail) {
          // If it's a general error message
          setError(errorData.detail);
        } else {
          // If it's a validation error for specific questions
          const newValidationErrors = {};
          Object.keys(errorData).forEach(key => {
            if (key.startsWith('question_')) {
              const questionId = key.split('_')[1];
              newValidationErrors[questionId] = errorData[key];
            }
          });
          setValidationErrors(newValidationErrors);
        }
      } else {
        setError('Failed to submit response');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading survey...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
          {showLoginPrompt && (
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Login to Continue
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{survey.title}</h1>
            <p className="text-gray-600 mb-8">{survey.description}</p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {survey.questions.map((question) => (
                <div key={question.id} className="space-y-4">
                  <label className="block text-lg font-medium text-gray-900">
                    {question.text}
                    {question.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>

                  {validationErrors[question.id] && (
                    <div className="text-red-500 text-sm mt-1">
                      {validationErrors[question.id]}
                    </div>
                  )}

                  {question.question_type === 'text' && (
                    <input
                      type="text"
                      className={`mt-1 block w-full border ${
                        validationErrors[question.id] ? 'border-red-500' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                    />
                  )}

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {question.choices.map((choice) => (
                        <div key={choice.id} className="flex items-center">
                          <input
                            type="checkbox"
                            className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                              validationErrors[question.id] ? 'border-red-500' : 'border-gray-300'
                            } rounded`}
                            checked={answers[question.id]?.choices?.includes(choice.id) || false}
                            onChange={() => handleChoiceChange(question.id, choice.id, true)}
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            {choice.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  {question.question_type === 'single_choice' && (
                    <div className="space-y-2">
                      {question.choices.map((choice) => (
                        <div key={choice.id} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 ${
                              validationErrors[question.id] ? 'border-red-500' : 'border-gray-300'
                            }`}
                            checked={answers[question.id]?.choice === choice.id}
                            onChange={() => handleChoiceChange(question.id, choice.id)}
                            required={question.required}
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            {choice.text}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {submitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyResponse;
