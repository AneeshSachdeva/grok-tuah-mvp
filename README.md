# Grok Tuah Learning System

Welcome to the Grok Tuah repository! This project is an AI-powered adaptive learning system that creates personalized, infinitely expandable learning experiences. Grok Tuah transforms any concept into a "knowledge tree" of interconnected core principles, allowing learners to explore subjects with unlimited depth and breadth.

## Project Overview

Grok Tuah is built using Next.js and leverages advanced AI models to generate tailored curricula, lesson outlines, and interactive content. The system adapts to each user's background and goals, providing a unique and engaging learning experience.

### Key Features

- Personalized learning paths
- AI-generated curricula and lessons
- Interactive content generation
- Hierarchical topic exploration
- Adaptive difficulty based on user background

## Project Structure

The project follows a typical Next.js structure with some additional directories for AI prompts and custom components:

```
grok-tuah/
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── grok/
│   │   └── ...
│   ├── components/
│   ├── lib/
│   └── ...
├── prompts/
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

- `src/app`: Contains the main application pages and API routes
- `src/components`: Reusable React components
- `src/lib`: Utility functions and type definitions
- `prompts`: AI prompt templates for curriculum and lesson generation

## Running the Project Locally

To run Grok Tuah on your local machine, follow these steps:

1. Clone the repository:
```
git clone https://github.com/your-username/grok-tuah.git
cd grok-tuah
```

2. Install dependencies:
```
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your Anthropic API key:
```
ANTHROPIC_API_KEY=your_api_key_here
```

4. Run the development server:
```
npm run dev
```


5. Open your browser and navigate to `http://localhost:3000` to see the application running.

## TODOs

While the current version of Grok Tuah demonstrates the core functionality, there are several areas for future development:

1. Implement non-text multimedia artifacts:
- [ ] Add support for generating SVG diagrams
- [ ] Implement interactive simulations using JavaScript
- [ ] Create a system for generating and rendering complex visualizations

2. Develop learning assessments:
- [ ] Design and implement a framework for generating adaptive quizzes
- [ ] Create a scoring system to track user progress
- [ ] Develop algorithms to identify areas for improvement based on assessment results

3. Integrate a chat UI for real-time interaction:
- [ ] Implement a chat interface for users to ask questions while learning
- [ ] Develop an AI model fine-tuned for answering context-specific questions
- [ ] Create a system for maintaining conversation context within a Grok

4. Enhance the user interface:
- [ ] Improve the sidebar navigation for easier exploration of the knowledge tree
- [ ] Implement a more intuitive way to visualize and interact with the Grok hierarchy
- [ ] Add animations and transitions to improve the user experience

We welcome contributions to any of these areas or other improvements you think would enhance Grok Tuah!
