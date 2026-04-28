# AI-Powered SIEM System - Backend

## Overview
The AI-Powered Security Information and Event Management (SIEM) system is designed to enhance security monitoring and incident response through advanced log analysis and behavior detection. This backend component serves as the core of the system, handling data processing, rule management, alert generation, and user authentication.

## Features
- **Log Deduplication**: Efficiently removes duplicate logs to reduce noise and improve analysis accuracy.
- **Behavior Analysis**: Analyzes user behavior to identify anomalies and potential security threats.
- **Rule Management**: Allows administrators to create, modify, and manage security rules.
- **Alerting System**: Generates alerts based on predefined rules and detected anomalies.
- **API Endpoints**: Provides RESTful API endpoints for frontend integration.

## Project Structure
- **src/**: Contains the source code for the backend application.
  - **api/**: Contains the API routes and middleware.
  - **services/**: Contains business logic for deduplication, behavior analysis, rule processing, and alerting.
  - **models/**: Defines the data models used in the application.
  - **database/**: Manages database connections and migrations.
  - **config/**: Contains configuration settings for the application.
  - **app.ts**: Main entry point for the backend application.

## Getting Started
1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd ai-powered-siem-system/backend
   ```

2. **Install Dependencies**:
   ```
   npm install
   ```

3. **Set Up Database**:
   - Configure your database settings in `src/config/config.ts`.
   - Run the SQL migration to initialize the database schema:
     ```
     <database-command> < src/database/migrations/init.sql
     ```

4. **Start the Server**:
   ```
   npm start
   ```

## API Documentation
Refer to the API routes defined in the `src/api/routes/` directory for detailed information on available endpoints and their usage.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.