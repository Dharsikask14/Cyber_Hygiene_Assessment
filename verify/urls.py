from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_certificate, name='generate_certificate'),
    path('verify/<str:cert_id>/', views.verify_certificate, name='verify_certificate'),
]
