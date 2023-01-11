const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

/**
 * POST
 * Create a new user
 */
app.post('/api/users', function (req, res) {});

/**
 * POST
 * Add a new exercise
 */
app.post('/api/users/:_id/exercises', function (req, res) {});

/**
 * GET
 * Get a user's exercise log
 */
app.get('', function (req, res) {});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
