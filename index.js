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

const exerciseSchema = new mongoose.Schema(
	{
		description: { type: String, required: true },
		duration: { type: Number, required: true },
		date: String,
	},
	{ autoIndex: false }
);

const userSchema = new mongoose.Schema(
	{
		username: { type: String, required: true },
		_id: String,
		log: [exerciseSchema],
	},
	{ autoIndex: false }
);

//* Models

let User = mongoose.model('User', userSchema);

let Exercise = mongoose.model('Exercise', exerciseSchema);

//* Endpoints

/*
 * GET
 * Delete all users
 */
app.get('/api/users/delete', function (_req, res) {
	console.log('deleting all users...'.toLocaleUpperCase());

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
	console.log('deleting all exercises...'.toLocaleUpperCase());

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
	console.log('getting all users...'.toLocaleUpperCase());

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
	const userId = req.params[_id];
	const description = req.body.description;
	const duration = req.body.duration;
	const date = req.body.date;

	//? Check for date
	if (date === '') {
		date = new Date().toISOString().substring(0, 10);
	}

	//* Create new exercise
	let newExercise = new Exercise({
		description: description,
		duration: parseInt(duration),
		date: date,
	});

	//? Find the user
	console.log(
		'looking for user with id ['.toLocaleUpperCase() + userId + '] ...'
	);
	User.findOneAndUpdate(
		userId,
		{ $push: { log: newExercise } },
		{ new: true },
		(error, updatedUser) => {
			if (error) {
				console.error(error);
				res.json({ message: 'Exercise creation failed!' });
			}

			res.json({
				username: updatedUser.username,
				description: newExercise.description,
				duration: newExercise.duration,
				date: new Date(newExercise.date).toDateString(),
				_id: updatedUser._id,
			});
		}
	);
});

/*
 * GET
 * Get a user's exercise log
 * @param _id
 */
app.get('/api/users/:_id/logs?from&to&limit', function (req, res) {
	const userId = req.params._id;
	const from = req.params.description;
	const to = req.params.duration;
	const limit = req.params.date;
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
