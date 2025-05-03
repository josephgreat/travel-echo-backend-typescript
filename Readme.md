# Travel Echo

Welcome to the back-end module of the **Travel Echo** application

## API Documentation

The API documentation can be found at [https://travel-echo-backend.onrender.com/api.html](https://travel-echo-backend.onrender.com/api.html)

## Setup and Configurations

### Environmental Variables

Use the env utility object found in `src/utils/env.js` to get, set, and check for environmental variables.

- `env.get(key, defaultValue)`: Get the value of an environment variable. If the variable is not set in the .env file, returns the default value if provided. If no default value is provided, returns undefined
- `env.set(key, value)`: Set the value of an environment variable.
- `env.has(key)`: Check if an environment variable exists. Returns true or false

Make sure the following environmental variables are set before running the server

- BASE_URL : The base URL of the application e.g. http://localhost

- CLOUDINARY_API_KEY : The Cloudinary API key
- CLOUDINARY_API_SECRET : The Cloudinary API secret
- CLOUDINARY_CLOUD_NAME : The Cloudinary cloud name
- CLOUDINARY_URL : The Cloudinary connection string

- EMAIL_HOST : The email host e.g. smtp.gmail.com
- EMAIL_PASSWORD : The email service password
- EMAIL_USER : The email user e.g. user@gmail.com

- GOOGLE_CLIENT_ID : The Google client ID for Google authentication
- GOOGLE_CLIENT_SECRET : The Google client secret for Google authentication

- MONGO_URI : The connection string for the MongoDB database; defaults to mongodb://localhost:27017/travel_echo

- JWT_SECRET : The secret key used for JWT authentication; a random string of at least 32 characters is recommended

- PORT : The port number to run the server on; defaults to 5000

### Scripts

- `npm run dev` : Starts the development server
- `npm run start` : Starts the production server
- `npm run swagger`: Generates the swagger documentation found in docs/swagger-doc.json
- `npm run create:domain`: Creates a new domain with a router file, a controller file and a services folder, e.g. 'npm run create:domain auth'
- `npm run create:model`: Creates a new mongoose model, e.g. 'npm run create:model User'
- `npm run create:doc`: Creates or updates the API documentation, e.g. 'npm run create:doc'
- Refer to the package.json file for more scripts
