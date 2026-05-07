# ByteBite

## 1. Problem Statement
Cooking a new meal often starts with inspiration from a blog, a social media post, or a handwritten note. However, the transition from "finding a recipe" to "having the ingredients" is filled with friction. Users often have to manually read through long descriptions, identify specific ingredients, estimate quantities, and then rewrite them into a categorized list suitable for a grocery store layout. 

**ByteBite** solves this by removing the manual labor of list-making. It addresses the user's need for efficiency and accuracy, ensuring no ingredient is overlooked and reducing the time spent planning meals.

## 2. Main Functionality
The core of the application is an intelligent parser that transforms unconcrete recipes into clearly structured lists with quantity estimations, allowing an improved shopping and cooking experience. Key features include:
* **Recipe Extraction:** Paste a full recipe text (including stories or instructions), and the app extracts only the necessary ingredients. Alternatively, paste the name of a recipe and the app will generate a full ingredients list.
* **Intelligent Categorization:** Ingredients are automatically grouped by grocery store aisles (e.g., Produce, Dairy, Spices, Meat).
* **Dietary & Allergy Filtering:** Users can state preferences (e.g., Vegan, Vegetarian, Gluten-Free, Lactose-Free). The app automatically identifies "red flag" ingredients and suggests safe alternatives.

## 3. Intended Users
* **The Busy Professional:** Someone who wants to cook healthy meals but lacks the time to manually plan grocery trips.
* **The Home Cook:** Enthusiasts who love trying new recipes from diverse sources but find the organization part tedious.
* **Students on a Budget:** Users who need to ensure they only buy exactly what they need for a specific set of meals to avoid food waste.

## 4. Meaningful GenAI Integration
Unlike traditional apps that rely on rigid "If/Then" logic or specific formatting, ByteBite uses Generative AI (LLMs) to leverage its knowledge of countless recipes to generate custom grocery lists personalized to the users instructions:
* **Substitution Logic:** If a recipe calls for an obscure ingredient, the GenAI can suggest common alternatives directly on the shopping list.
* **Scaling & Adjustments:** Users can ask the AI to "Scale this recipe for 6 people instead of 2," and the shopping list will update dynamically using the AI's mathematical reasoning.

## 5. User Scenarios
### Scenario A: The Blog Post Parser
* **User Action:** Jason finds a 2,000-word blog post about "The Best Sunday Roast." He copies the entire text, including the author's life story, and pastes it into ByteBite.
* **App Action:** The AI ignores the anecdotes about the author's grandmother and generates a clean list: "1.5kg Beef Brisket, 4 Large Carrots, 2 Sprigs of Rosemary."

### Scenario B: The Lactose Dilemma
* **User Action:** Mark asks for a recipe for Chicken Piccata but wants to know if he can swap the heavy cream for something lactose free.
* **App Action:** He asks the integrated AI assistant. The AI suggests using lactose free yogurt and automatically updates his shopping list with the alternative ingredient.

### Scenario C: Weekly Meal Prep
* **User Action:** A user adds three different recipes for the week: Tacos, Stir-fry, and Salad.
* **App Action:** The app identifies that all three recipes require "cilantro" and "lime." Instead of three separate entries, it provides a total count (e.g., "2 Bunches of Cilantro, 4 Limes") and sorts them into the 'Produce' section for a single trip through that aisle.

## Project Layout

```
team-bytebite/
├── client/       # React + Vite frontend
├── server/       # Java Spring Boot backend API
└── gen-ai/       # Python FastAPI service for AI-based recipe and shopping list generation
```

## Services

### `client` — React / Vite
The user-facing web application. Provides a dish name input and displays the generated shopping list. Communicates with the backend via REST.

### `server` — Java Spring Boot
The core backend API. Manages users, recipes, and shopping lists. Orchestrates requests between the client and the gen-ai service.

### `gen-ai` — Python FastAPI
The AI generation service. Receives a dish name from the server and returns a shopping list with all required ingredients using LLM integrations.

## Getting Started

Each service has its own setup instructions in its respective directory's README.
