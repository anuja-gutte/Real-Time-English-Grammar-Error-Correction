# Real-Time Grammar Correction UI

This repository contains the dataset, .ipnyb file , user interface and backend API for the Real-Time Grammar Correction service. It is split into two main components: a React-based frontend and a Flask-based backend.

## Architecture

* **Frontend**: A React application built with `create-react-app` that allows users to input text and view real-time grammar corrections.
* **Backend**: A Flask web service that uses PyTorch and Hugging Face Transformers to process text and perform the actual grammar correction.

## Prerequisites

Make sure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (for the React frontend)
* [Python 3.7+](https://www.python.org/) (for the Flask backend)
* `pip` (Python package manager)

## Running the Project Locally

To run the application, you need to start both the frontend and the backend servers.

### 1. Start the Backend Server

The backend runs on port `5000` by default.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend should now be running at `http://localhost:5000`.

### 2. Start the Frontend Server

The frontend runs on port `3000` by default.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm start
   ```
   Your web browser should automatically open the UI at `http://localhost:3000`.

