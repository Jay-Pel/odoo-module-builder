# Odoo Module Builder

A web-based application for generating custom Odoo ERP modules through a guided, conversational interface.

## Overview

The Odoo Module Builder is a tool that allows users to generate custom Odoo ERP modules by answering a series of questions in a chat-like interface. The application guides users through the process of defining module requirements, generates a detailed specification document for review, creates a development plan, and then automatically generates, tests, and delivers the Odoo module file.

## Features

- **Guided Prompting:** The application guides the user through a series of questions to gather module requirements effectively.
- **Conversational Interface:** A chat-like interface for users to interact with the application.
- **Specification Review & Modification:** Users can review and modify the generated module specification document.
- **Development Plan Review:** Users can review the step-by-step development plan before initiating module generation.
- **Automated Testing:** The application performs automated tests to check the generated module for errors.
- **Frontend Browser Automation:** The application uses browser automation to perform frontend testing.
- **Screenshot Generation:** The application captures screenshots during frontend testing as part of the "Proof of Tests".
- **Error Reporting:** The application feeds back errors and screenshot evidence to the underlying LLM for potential self-correction or reporting.

## Tech Stack

- **Frontend:** React, styled-components
- **Backend:** Python, Flask
- **LLM Integration:** OpenAI API, Anthropic API
- **Testing:** Automated backend and frontend testing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Odoo instance for testing (optional)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/odoo-module-builder.git
   cd odoo-module-builder
   ```

2. Set up the frontend:
   ```
   cd frontend
   npm install
   ```

3. Set up the backend:
   ```
   cd ../backend
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in the backend directory
   - Add your OpenAI API key and/or Anthropic API key to the `.env` file

### Running the Application

1. Start the backend server:
   ```
   cd backend
   python main.py
   ```

2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Start Building:** Click on "Start Building Now" on the home page to begin the module creation process.
2. **Answer Questions:** Answer the questions in the chat interface to define your module requirements.
3. **Review Specification:** Review the generated specification document and request modifications if needed.
4. **Approve Development Plan:** Review and approve the development plan.
5. **Generate Module:** The application will generate the Odoo module based on the approved development plan.
6. **Download Module:** Once the module is generated and tested, you can download it for installation in your Odoo instance.

## Project Structure

- `frontend/`: React frontend application
  - `src/`: Source code
    - `components/`: Reusable UI components
    - `pages/`: Page components
    - `styles/`: Global styles and theme
- `backend/`: Flask backend application
  - `api/`: API endpoints
  - `services/`: Business logic services
  - `data/`: Data storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.