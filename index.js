const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');

require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB

mongoose.connect(process.env.MONGO_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
	username: String,
	_id: String,
});

let ExerciseUser = mongoose.model('ExerciseUser', userSchema);

const exerciseSchema = new mongoose.Schema({
	username: String,
	description: String,
	duration: Number,
	date: String,
	_id: String,
});

let Exercise = mongoose.model('Exercise', exerciseSchema);

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

/**
 * POST
 * Create a new user
 */
app.post('/api/users', function (req, res) {
	const inputUsername = req.body.username;
	const id = shortid.generate();

	console.log(
		'creating a new user with username - '.toLocaleUpperCase() + inputUsername
	);
	let newUser = new ExerciseUser({ username: inputUsername, _id: id });

	newUser.save((err, user) => {
		if (err) {
			console.error(err);
			res.json({ message: 'User creation failed! Something went wrong...' });
		}

		res.json({ message: 'User creation successful!', user: user });
	});
});

/**
 * POST
 * Add a new exercise
 * @param _id
 */
app.post('/api/users/:_id/exercises', function (req, res) {
	const userId = req.params._id;
	const description = req.body.description;
	const duration = req.body.duration;
	const dateInput = req.body.date;

	//* Find the user
	console.log(
		'looking for user with id ['.toLocaleUpperCase() + userId + '] ...'
	);
	ExerciseUser.findOne({ _id: userId }, function (err, user) {
		if (err) {
			console.log('there is no user with that id...'.toLocaleUpperCase(), err);
			res.json({ message: 'User not found!' });
		}

		//* Create the exercise for that user
		const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		const months = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		const date = new Date(dateInput);

		let day = days[dateInput.getDay()];
		let month = months[dateInput.getMonth()];
		const fullDate =
			day + ' ' + month + ' ' + date.getDate() + ' ' + date.getFullYear();

		let newExercise = new Exercise({
			username: user.username,
			description: description,
			duration: duration,
			date: fullDate,
			_id: user._id,
		});

		newExercise.save((err, exercise) => {
			if (err) {
				console.error(err);
				res.json({
					message: 'Exercise creation failed! Something went wrong...',
				});
			}

			res.json({
				message: 'Exercise creation successful!',
				exercise: exercise,
			});
		});
	});
});

/**
 * GET
 * Get a user's exercise log
 */
app.get('/api/users/:_id/logs?from&to&limit', function (req, res) {});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
});
