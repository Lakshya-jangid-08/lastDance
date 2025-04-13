export const Question = {
    id: '',
    type: 'text',
    title: '',
    description: '',
    required: false,
    options: [],
    minRating: 1,
    maxRating: 5,
    scaleLabels: {
      start: '',
      end: ''
    },
    matrixRows: [],
    matrixColumns: [],
    fileTypes: [],
    maxFileSize: 5
  };
  
  export const Survey = {
    id: '',
    title: '',
    description: '',
    questions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    responseCount: 0,
    status: 'draft'
  };
  
  export const Response = {
    id: '',
    surveyId: '',
    answers: {},
    submittedAt: new Date(),
    respondentId: ''
  };
  
  export const SurveyAnalytics = {
    totalResponses: 0,
    completionRate: 0,
    averageTimeToComplete: 0,
    questionAnalytics: []
  };
  
  export const QuestionAnalytics = {
    questionId: '',
    responseCount: 0,
    distribution: {},
    averageRating: 0
  };