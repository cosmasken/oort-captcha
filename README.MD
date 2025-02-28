# CAPTCHA Verification App

This is a CAPTCHA verification app that fetches images from Oort storage and displays them to the user for verification. The user needs to complete the CAPTCHA to proceed.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- An Oort storage account with API access

## Installation

1. Clone the repository:

```bash
git clone https://github.com/cosmasken/oort-captcha.git
cd oort-captcha
```

2. Install the dependencies

```bash
npm install
```

3. Create a .env file in the root directory and add your Oort storage configuration:

OORT_ENDPOINT="https://s3-standard.oortech.com"
OORT_ACCESS_KEY_ID=""
OORT_SECRET_ACCESS_KEY=""

4. Usage

Open your browser and go to http://localhost:3000 to access the app.

## Project Structure
```
## Project Structure

- **server.js**: The main server file that handles API requests and serves the frontend.
- **public**: The directory containing the frontend files (HTML, CSS, JavaScript).
- **app.js**: The main JavaScript file for the frontend.
- **.env**: Environment variables for Oort storage configuration (not included in the repository).
- **.gitignore**: Git ignore file to exclude certain files and directories from version control.

## API Endpoints

- **GET /api/captcha**: Fetches a set of CAPTCHA images from Oort storage.
- **POST /api/verify-captcha**: Verifies the selected CAPTCHA images.
```
