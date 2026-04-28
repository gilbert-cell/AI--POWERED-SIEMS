# AI-Powered SIEM System

## Overview
The AI-Powered Security Information and Event Management (SIEM) system is designed to enhance security monitoring and incident response through advanced log analysis, behavior analysis, and AI-driven decision-making. This project aims to reduce false positives by eliminating duplicate logs and providing a user-friendly interface for administrators to manage rules and thresholds effectively.

## Features
- **Log Deduplication**: Automatically removes duplicate logs to minimize noise and improve analysis accuracy.
- **Behavior Analysis**: Analyzes user behavior to identify anomalies and potential security threats.
- **Dashboard**: Provides an overview of system status, analytics, and alerts.
- **Tuning Interface**: Allows administrators to create and modify rules, adjust thresholds, and tune AI decision-making parameters.
- **Log Viewer**: Displays logs for review and analysis.

## Project Structure
```
ai-powered-siem-system
├── frontend
│   ├── public
│   ├── src
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── backend
│   ├── src
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ai-powered-siem-system
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```
   cd ../backend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend application:
   ```
   cd ../frontend
   npm start
   ```

### Usage
- Access the frontend application at `http://localhost:3000`.
- Use the dashboard to monitor system status and alerts.
- Navigate to the tuning interface to adjust rules and thresholds.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.