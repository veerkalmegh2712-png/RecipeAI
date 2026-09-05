from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from google import genai
import json


@api_view(["GET"])
def health_check(request):
    return Response({
        "status": "ok",
        "message": "RecipeAI backend is running!"
    })


@api_view(["POST"])
def generate_recipe(request):
    message = request.data.get("message")

    if not message:
        return Response(
            {
                "success": False,
                "error": "Message is required."
            },
            status=400
        )

    try:
        # Create Gemini client
        client = genai.Client(
            api_key=settings.GEMINI_API_KEY
        )

        prompt = f"""
You are RecipeAI, an expert cooking assistant.

The user says:
"{message}"

Create ONE practical recipe based on the user's request.

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.
Do not add explanations before or after the JSON.

Use exactly this structure:

{{
    "recipeName": "Name of the recipe",
    "cookingTime": "25 minutes",
    "difficulty": "Easy",
    "servings": "2 servings",
    "description": "Short description of the recipe",
    "ingredients": [
        "ingredient 1",
        "ingredient 2",
        "ingredient 3"
    ],
    "steps": [
        "Step 1",
        "Step 2",
        "Step 3"
    ],
    "tips": [
        "Helpful cooking tip 1",
        "Helpful cooking tip 2"
    ]
}}

Rules:
- Keep the recipe simple and practical.
- Use ingredients mentioned by the user whenever possible.
- You may add common pantry ingredients when necessary.
- Give 4 to 8 ingredients.
- Give 4 to 8 cooking steps.
- Give 1 to 3 useful tips.
- Cooking time should be realistic.
- Difficulty must be one of: Easy, Medium, Hard.
- Return valid JSON only.
"""

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        raw_text = response.text.strip()

        print("GEMINI RAW RESPONSE:")
        print(raw_text)

        # Remove Markdown code fences if Gemini accidentally adds them
        if raw_text.startswith("```"):
            raw_text = raw_text.replace("```json", "")
            raw_text = raw_text.replace("```", "")
            raw_text = raw_text.strip()

        # Convert Gemini JSON into Python dictionary
        recipe = json.loads(raw_text)

        # Validate required fields
        required_fields = [
            "recipeName",
            "cookingTime",
            "difficulty",
            "servings",
            "description",
            "ingredients",
            "steps",
            "tips",
        ]

        for field in required_fields:
            if field not in recipe:
                raise ValueError(
                    f"Gemini response is missing field: {field}"
                )

        return Response({
            "success": True,
            "recipe": recipe
        })

    except json.JSONDecodeError:
        print("GEMINI JSON ERROR")

        return Response(
            {
                "success": False,
                "error": "Gemini returned an invalid recipe format.",
                "details": raw_text if "raw_text" in locals() else ""
            },
            status=500
        )

    except Exception as error:
        print("GEMINI ERROR:", error)

        return Response(
            {
                "success": False,
                "error": "Unable to generate recipe.",
                "details": str(error)
            },
            status=500
        )