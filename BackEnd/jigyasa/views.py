from rest_framework import status, generics, viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, SurveySerializer, QuestionSerializer, ChoiceSerializer, SurveyResponseSerializer, OrganizationSerializer, UserProfileSerializer
from .models import Survey, Question, Choice, SurveyResponse, Answer, Organization, UserProfile
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.generics import RetrieveAPIView, get_object_or_404
from django.shortcuts import render
# from jigyasa_survey.models import Survey, Question  # Replace with your actual app name

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user': UserSerializer(user).data
                })
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'User does not exist'}, status=status.HTTP_404_NOT_FOUND)

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class SurveyCreateView(generics.CreateAPIView):
    queryset = Survey.objects.all()
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            # Add creator to the request data
            request.data['creator'] = request.user.id
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SurveyDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, creator_id, survey_id, *args, **kwargs):
        survey = get_object_or_404(Survey, id=survey_id, creator_id=creator_id)
        questions = survey.question_set.prefetch_related('choice_set')
        survey_data = {
            'id': survey.id,
            'title': survey.title,
            'description': survey.description,
            'questions': [
                {
                    'id': question.id,
                    'text': question.text,
                    'question_type': question.question_type,
                    'choices': [{'id': choice.id, 'text': choice.text} for choice in question.choice_set.all()],
                }
                for question in questions
            ],
        }
        return Response(survey_data, status=status.HTTP_200_OK)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]

class SurveyViewSet(viewsets.ModelViewSet):
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Survey.objects.prefetch_related('question_set', 'question_set__choice_set').all()
        return Survey.objects.prefetch_related('question_set', 'question_set__choice_set').filter(creator=user)

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.creator != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to edit this survey."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.creator != request.user and not request.user.is_staff:
            return Response(
                {"detail": "You do not have permission to edit this survey."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Get questions with choices
        questions = Question.objects.filter(survey=instance).prefetch_related('choice_set')
        survey_data = self.get_serializer(instance).data
        survey_data['questions'] = QuestionSerializer(questions, many=True).data
        return Response(survey_data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public(self, request, pk=None):
        survey = self.get_object()
        
        # Check if survey requires organization access
        if survey.requires_organization:
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required for this survey"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check if user belongs to the same organization
            user_org = request.user.profile.organization
            if not user_org or user_org != survey.organization:
                return Response(
                    {"detail": "You don't have access to this survey"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get questions with choices
        questions = Question.objects.filter(survey=survey).prefetch_related('choice_set')
        
        # Serialize questions with their choices
        questions_data = []
        for question in questions:
            question_data = {
                'id': question.id,
                'text': question.text,
                'question_type': question.question_type,
                'required': question.required if hasattr(question, 'required') else False,
                'choices': [{'id': choice.id, 'text': choice.text} for choice in question.choice_set.all()]
            }
            questions_data.append(question_data)
        
        # Serialize the survey data
        survey_data = {
            'id': survey.id,
            'title': survey.title,
            'description': survey.description,
            'is_active': survey.is_active,
            'requires_organization': survey.requires_organization,
            'questions': questions_data
        }
        
        return Response(survey_data)

class SurveyResponseViewSet(viewsets.ModelViewSet):
    serializer_class = SurveyResponseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get survey ID from query params
        survey_id = self.request.query_params.get('survey')
        
        # If survey ID is provided, return all responses for that survey
        if (survey_id):
            return SurveyResponse.objects.filter(survey_id=survey_id).prefetch_related(
                'answer_set',
                'answer_set__selected_choices',
                'answer_set__question'
            )
        
        # Otherwise, return only the user's responses
        return SurveyResponse.objects.filter(respondent=self.request.user).prefetch_related(
            'answer_set',
            'answer_set__selected_choices',
            'answer_set__question'
        )

    def create(self, request, *args, **kwargs):
        survey_id = request.data.get('survey')
        try:
            survey = Survey.objects.get(id=survey_id)
            
            # Check organization access if required
            if survey.requires_organization:
                if not request.user.is_authenticated:
                    return Response(
                        {"detail": "Authentication required for this survey"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                user_org = request.user.profile.organization
                if not user_org or user_org != survey.organization:
                    return Response(
                        {"detail": "You don't have access to this survey"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Add respondent if user is authenticated
            if request.user.is_authenticated:
                request.data['respondent'] = request.user.id
            
            # Ensure answers are properly linked to the survey
            answers_data = request.data.pop('answers', [])
            
            # Validate required questions
            required_questions = Question.objects.filter(survey=survey, required=True)
            answered_question_ids = [answer.get('question') for answer in answers_data]
            
            missing_required_questions = required_questions.exclude(id__in=answered_question_ids)
            if missing_required_questions.exists():
                errors = {}
                for question in missing_required_questions:
                    errors[f"question_{question.id}"] = "This field is required"
                return Response(
                    errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate answer content
            for answer_data in answers_data:
                question_id = answer_data.get('question')
                question = Question.objects.get(id=question_id, survey=survey)
                
                if question.required:
                    if question.question_type == 'text':
                        if not answer_data.get('text_answer', '').strip():
                            return Response(
                                {f"question_{question.id}": "Please provide an answer"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
                    elif question.question_type in ['multiple_choice', 'single_choice']:
                        selected_choices = answer_data.get('selected_choices', [])
                        if not selected_choices:
                            return Response(
                                {f"question_{question.id}": "Please select at least one choice"},
                                status=status.HTTP_400_BAD_REQUEST
                            )
            
            response = SurveyResponse.objects.create(survey=survey, respondent=request.user)
            
            for answer_data in answers_data:
                question_id = answer_data.get('question')
                question = Question.objects.get(id=question_id, survey=survey)
                selected_choices = answer_data.get('selected_choices', [])
                text_answer = answer_data.get('text_answer', None)
                
                answer = Answer.objects.create(
                    response=response,
                    question=question,
                    text_answer=text_answer
                )
                if selected_choices:
                    answer.selected_choices.set(selected_choices)
            
            return Response({"detail": "Response submitted successfully"}, status=status.HTTP_201_CREATED)
            
        except Survey.DoesNotExist:
            return Response(
                {"detail": "Survey not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        survey = instance.survey

        # Fetch questions with their choices
        questions = Question.objects.filter(survey=survey).prefetch_related('choice_set')
        questions_data = [
            {
                'id': question.id,
                'text': question.text,
                'question_type': question.question_type,
                'choices': [{'id': choice.id, 'text': choice.text} for choice in question.choice_set.all()],
            }
            for question in questions
        ]

        # Include questions with choices in the response
        response_data = {
            'id': survey.id,
            'title': survey.title,
            'description': survey.description,
            'questions': questions_data,
        }
        return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def organization_surveys(request):
    user = request.user
    if not user.profile.organization:
        return Response({"detail": "User is not associated with any organization."}, status=status.HTTP_400_BAD_REQUEST)
    
    organization = user.profile.organization
    surveys = Survey.objects.filter(organization=organization).exclude(creator=user)
    serializer = SurveySerializer(surveys, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
