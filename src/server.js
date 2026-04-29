// server.js - Merged Code

// Load environment variables first
require('dotenv/config'); // Loads variables into process.env
require('dotenv').config({ path: '../.env' }); // Optional: Load from specific .env file if needed

const express = require('express');
const http = require('http');       // Require http explicitly
const path = require('path');       // Require path for resolving paths
const { Server } = require('socket.io'); // Import Server class for options
const jwt = require('jsonwebtoken'); // Require jsonwebtoken for auth
const cookieParser = require('cookie-parser');

// --- Configuration & Route Imports ---
const configViewEngine = require('./config/configEngine'); // Your view engine setup function
const routes = require('./routes/web');                   // Your main web routes object { initWebRouter: ... }
// const cronJobContronler = require('./controllers/cronJobContronler'); // Your cron job logic
// const socketIoController = require('./controllers/socketIoController');  // Your other socket logic (admin messages?)
// const aviatorController = require('./controllers/aviatorController'); 
// const Dragon = require('./controllers/dragonController');

 // Your Aviator game logic

// --- Constants ---
const YOUR_JWT_SECRET = process.env.JWT_SECRET || 'your_strong_secret_key'; // Use the same secret as in login controller
const port = process.env.PORT || 3000; // Use environment variable or default

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app); // Use http.createServer
const io = new Server(server, {      // Initialize Socket.IO with options
    cors: {
        origin: '*', // Configure CORS properly for production
        // methods: ["GET", "POST"] // Optional: specify allowed methods
    }
});

// --- Express Middleware ---
app.use(cookieParser()); // For parsing cookies if needed by auth/routes
app.use(express.json()); // For parsing JSON request bodies
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded request bodies

// --- Static File Serving ---
// Configure static paths relative to THIS server.js file's location
// Assuming 'public' (for css, js, images) is in the project root (GoaGamesStandard)
const publicPath = path.resolve(__dirname, '../public'); // Adjust '../' based on server.js location relative to root
console.log("Setting static files directory to:", publicPath);
app.use(express.static(publicPath));

// Assuming 'uploads' is in the project root
const uploadsPath = path.resolve(__dirname, '../uploads'); // Adjust '../' based on server.js location relative to root
console.log("Setting uploads directory to:", uploadsPath);
app.use('/uploads', express.static(uploadsPath)); // Serve uploads folder at /uploads route

// --- View Engine Setup ---
// Make sure configViewEngine sets the correct ABSOLUTE path to your views directory
// (e.g., using path.resolve(__dirname, '../src/views') inside configEngine.js)
configViewEngine(app);

// --- Initialize Web Routes ---
// Ensure ./routes/web exports { initWebRouter } and contains all necessary routes
routes.initWebRouter(app);


// --- Socket.IO Authentication Middleware (From index.js) ---
// io.use((socket, next) => {
//     console.log(`Socket attempting connection (${socket.id}). Checking token...`);
//     // const token = socket.handshake.auth.token; // Get token from client connection attempt

//     // if (!token) {
//     //     console.error(`Socket connection rejected (${socket.id}): No token provided.`);
//     //     // Disconnect immediately if no token
//     //     // socket.disconnect(true); // Optional: Force disconnect
//     //     return next(new Error('Authentication error: No token provided')); // Reject connection middleware
//     // }

//     // jwt.verify(token, YOUR_JWT_SECRET, (err, decoded) => {
//     //     if (err) {
//     //         console.error(`Socket connection rejected (${socket.id}): Invalid token. ${err.message}`);
//     //         // Disconnect immediately on invalid token
//     //         // socket.disconnect(true); // Optional: Force disconnect
//     //         return next(new Error('Authentication error: Invalid token')); // Reject connection middleware
//     //     }
//         // Token is valid: Attach user info to the socket object
//         // socket.user = decoded; // Contains { userId: ..., phone: ... } etc. from JWT payload
//         console.log(`Socket authenticated (${socket.id})`);
//         next(); // Allow the connection
//     });


// --- Initialize Socket Event Handlers ---
// 1. Generic Dragon Tiger Handler (from index.js/socket.js)
// This will handle 'place_final_bets' etc. for authenticated users
// socketHandler(io);

// 2. Other Specific Socket Controllers (from original server.js)
// These likely handle different events or namespaces
// socketIoController.sendMessageAdmin(io); // Handles admin messages?
// aviatorController.Aviator(io);         // Handles Aviator game logic?
// Dragon.Dragon(io);
// Dragon.userDekh(io);

// --- Cron Jobs ---
// Cron jobs operate independently but might use 'io' to emit updates
// cronJobContronler.cronJobGame1p(io);

// --- 404 Handler ---
// Catch-all for requests that don't match any route
app.set('trust proxy', true);


app.get('/health', (req, res) => {
      console.log('Health check hit');
      res.status(200).send('OK');
    }); 
app.all('*', (req, res) => {
    // return res.render("404.ejs"); // Render a 404 page if you have one
    return res.status(404).send("404 Not Found"); // Or send a simple text response
});

// --- Start Server ---
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("JWT Secret Loaded:", YOUR_JWT_SECRET ? "Yes (First few chars: " + YOUR_JWT_SECRET.substring(0, 5) + "...)" : "NO - Using default!");
});

// require('dotenv/config')

// const express = require('express');
// const configViewEngine = require('./config/configEngine');
// const routes  = require('./routes/web');
// const cronJobContronler = require('./controllers/cronJobContronler');
// const socketIoController = require('./controllers/socketIoController');
// const aviatorController = require('./controllers/aviatorController');
// const socketHandler = require('./socket');



// let cookieParser = require('cookie-parser');
// require('dotenv').config({path:'../.env'});

// const app = express();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

// const port = 7777;

// app.use(cookieParser());
// // app.use(express.static('public'));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // setup viewEngine
// configViewEngine(app);
// // init Web Routes
// routes.initWebRouter(app);

// // Cron game 1 Phut 
// cronJobContronler.cronJobGame1p(io);

// // Check xem ai connect vào sever 
// socketIoController.sendMessageAdmin(io);

// aviatorController.Aviator(io);



// // app.all('*', (req, res) => {
// //     return res.render("404.ejs"); 
// // });





// server.listen(port, () => {
//     console.log("Connected success port: " + port);
// });


