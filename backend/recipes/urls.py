from django.urls import path

from .views import health_check, generate_recipe


urlpatterns = [
    path("health/", health_check),
    path("recipe/", generate_recipe),
]