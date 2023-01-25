const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');

require('dotenv').config();

//* Middleware

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//* MongoDB

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

//* Schemas

const exerciseSchema = new mongoose.Schema({
	_id: String,
	username: String,
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: String,
});

const userSchema = new mongoose.Schema({
	username: String,
	_id: String,
});

//* Models

let User = mongoose.model('User', userSchema);

let Exercise = mongoose.model('Exercise', exerciseSchema);

//* Endpoints

/*
 * GET
 * Delete all users
 */
app.get('/api/users/delete', function (_req, res) {
	console.log('### delete all users ###'.toLocaleUpperCase());

	User.deleteMany({}, function (err, result) {
		if (err) {
			console.error(err);
			res.json({
				message: 'Deleting all users failed!',
			});
		}

		res.json({ message: 'All users have been deleted!', result: result });
	});
});

/*
 * GET
 * Delete all exercises
 */
app.get('/api/exercises/delete', function (_req, res) {
	console.log('### delete all exercises ###'.toLocaleUpperCase());

	Exercise.deleteMany({}, function (err, result) {
		if (err) {
			console.error(err);
			res.json({
				message: 'Deleting all exercises failed!',
			});
		}

		res.json({ message: 'All exercises have been deleted!', result: result });
	});
});

app.get('/', async (_req, res) => {
	res.sendFile(__dirname + '/views/index.html');
	await User.syncIndexes();
	await Exercise.syncIndexes();
});

/*
 * GET
 * Get all users
 */
app.get('/api/users', function (_req, res) {
	console.log('### get all users ###'.toLocaleUpperCase());

	User.find({}, function (err, users) {
		if (err) {
			console.error(err);
			res.json({
				message: 'Getting all users failed!',
			});
		}

		if (users.length === 0) {
			res.json({ message: 'There are no users in the database!' });
		}

		console.log('users in database: '.toLocaleUpperCase() + users.length);
		res.json(users);
	});
});

/*
 * POST
 * Create a new user
 */
app.post('/api/users', function (req, res) {
	const inputUsername = req.body.username;
	const id = shortid.generate();

	console.log('### create a new user ###'.toLocaleUpperCase());

	console.log(
		'creating a new user with username - '.toLocaleUpperCase() + inputUsername
	);
	let newUser = new User({ username: inputUsername, _id: id });

	newUser.save((err, user) => {
		if (err) {
			console.error(err);
			res.json({ message: 'User creation failed!' });
		}

		console.log('user creation successful!'.toLocaleUpperCase());
		res.json({ username: user.username, _id: user._id });
	});
});

/*
 * POST
 * Add a new exercise
 * @param _id
 */
app.post('/api/users/:_id/exercises', function (req, res) {
	const userId = req.params._id;
	const description = req.body.description;
	const duration = req.body.duration;
	const date = req.body.date;

	console.log('### add a new exercise ###'.toLocaleUpperCase());

	//? Check for date
	if (date === '') {
		date = new Date().toISOString().substring(0, 10);
	}

	//? Find the user
	console.log(
		'looking for user with id ['.toLocaleUpperCase() + userId + '] ...'
	);
	User.findById(userId, (err, userInDb) => {
		if (err) {
			console.error(err);
			res.json({ message: 'There are no users with that ID in the database!' });
		}

		//* Create new exercise
		let newExercise = new Exercise({
			_id: userInDb._id,
			username: userInDb.username,
			description: description,
			duration: parseInt(duration),
			date: date,
		});

		newExercise.save((err, exercise) => {
			if (err) {
				console.error(err);
				res.json({ message: 'Exercise creation failed!' });
			}

			console.log('exercise creation successful!'.toLocaleUpperCase());
			res.json({
				username: userInDb.username,
				description: exercise.description,
				duration: exercise.duration,
				date: new Date(exercise.date).toDateString(),
				_id: userInDb._id,
			});
		});
	});
});

/*
 * GET
 * Get a user's exercise log
 * @param _id
 */
app.get('/api/users/:_id/logs?from&to&limit', function (req, res) {
	const userId = req.params._id;
	const from = req.params.description || new Date();
	const to = req.params.duration || new Date();
	const limit = req.params.date || 0;

	console.log('### get the log from a user ###'.toLocaleUpperCase());

	//? Find the user
	console.log(
		'looking for user with id ['.toLocaleUpperCase() + userId + '] ...'
	);
	User.findById(userId, (err, userInDb) => {
		if (err) {
			console.error(err);
			res.json({ message: 'There are no users with that ID in the database!' });
		}

		//? Find the exercises
		Exercise.find(
			{ _id: userId },
			{ date: { $gte: from, $lte: to } },
			{ description: 1, duration: 1, date: 1, _id: 0, username: 0 },
			{ limit: limit },
			function (err, exercises) {
				if (err) {
					console.error(err);
					res.json({ message: 'Exercise search failed!' });
				}

				let log = [];

				console.log('exercises search successful!'.toLocaleUpperCase());
				res.json({ size: exercises.length });
			}
		);
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
