from django.urls import path
from .views import GenerateAIContentView, ApproveContentView

urlpatterns = [
    path('generate/', GenerateAIContentView.as_view(), name='ai-generate'),
    path('approve/<int:pk>/', ApproveContentView.as_view(), name='ai-approve'),
]