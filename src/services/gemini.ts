// =========================================================
// GEMINI SERVICE
// Direct integration — no backend server required.
// Calls the Gemini REST API via fetch, replacing the Django backend.
// API key is loaded from EXPO_PUBLIC_GEMINI_API_KEY in .env
// =========================================================

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

const GEMINI_API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

export type Recipe = {
    recipeName: string;
    cookingTime: string;
    difficulty: string;
    servings: string;
    description: string;
    ingredients: string[];
    steps: string[];
    tips: string[];
};

function buildPrompt(userMessage: string): string {
    return `
You are RecipeAI, an expert cooking assistant.

The user says:
"${userMessage}"

Create ONE practical recipe based on the user's request.

Return ONLY valid JSON.
Do not use Markdown.
Do not use code fences.
Do not add explanations before or after the JSON.

Use exactly this structure:

{
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
}

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
`;
}

export async function generateRecipe(userMessage: string): Promise<Recipe> {
    if (!GEMINI_API_KEY) {
        throw new Error(
            "GEMINI_API_KEY is not set. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file."
        );
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: buildPrompt(userMessage),
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 1,
                responseMimeType: "application/json",
            },
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
            `Gemini API error ${response.status}: ${errorBody}`
        );
    }

    const data = await response.json();

    // Extract the text from Gemini's response envelope
    const rawText: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
        throw new Error("Gemini returned an empty response.");
    }

    // Strip accidental markdown fences if Gemini adds them
    let cleaned = rawText.trim();
    if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    const recipe: Recipe = JSON.parse(cleaned);

    // Validate required fields
    const required: (keyof Recipe)[] = [
        "recipeName",
        "cookingTime",
        "difficulty",
        "servings",
        "description",
        "ingredients",
        "steps",
        "tips",
    ];

    for (const field of required) {
        if (!(field in recipe)) {
            throw new Error(`Gemini response is missing field: ${field}`);
        }
    }

    return recipe;
}
