# Warden Backend
The backend for the [Warden](https://github.com/michaelsimmonsio/warden) project.

## Features

- Uses ExpressJS to create a REST API for the frontend to use. 
- Connects to a MongoDB database to retrieve and store data.
- Uses websockets with Sockets.io to send data to the frontend in real time. This can be expanded on with your own applications to communicate with the backend in real time as well.
- Comes with basic functions to get you started, such as report status updates, report creation, and report data retrieval.
- CORS enabled by default, so you can use this backend with any frontend.

## Setup

1. Clone this repository.
2. Create a `.env` file and add your MongoDB connection URI string under "`MONGOURI=""`".
3. Run `npm install` or `yarn` to install all dependencies.
4. Run `node index.js` to start the server.
