'use strict';
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session);

app.set('view engine', 'ejs');

app.use(bodyParser.json({
	type: 'application/*+json',
	limit: '500mb'
}));
app.use(bodyParser.json({
	type: 'application/json',
	limit: '500mb'
}));
app.use(bodyParser.urlencoded({
	extended: false,
	limit: '500mb'
}));
app.use(methodOverride('X-HTTP-Method')); // Microsoft
app.use(methodOverride('X-HTTP-Method-Override')); // Google/GData
app.use(methodOverride('X-Method-Override')); // IBM
app.use(methodOverride('_method'));
// app.use(responseHandler);
app.use(cors());
app.use((req, res, next) => {
	mongoose.set('debug', true);
	mongoose.connect('mongodb://localhost/foodify', { poolSize: 3, useNewUrlParser: true});
	// mongoose.Promise = global.Promise;
	// global.db = mongoose.connection
	next();
});
const store = new MongoDBStore({
	uri: 'mongodb://localhost:27017/foodify',
	connectionOptions: {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 10000
	}
});
store.on('error', function(error) {
	console.log(error);
	throw new Error(error);
});
app.use(session({
	secret: 'SessionSecretKey',
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 // 1 Day
	},
	store: store,
	resave: true,
	saveUninitialized: true
}));
// app.get('/check', function(req, res) {
// 	// req.session.userName = 'test';
// 	// res.send('Hello ' + JSON.stringify(req.session));
// 	req.session.destroy();
// 	res.send('Hello ' + JSON.stringify(req.session));
// });
//
// app.get('/check-new', function(req, res) {
// 	// req.session.userName = 'test';
// 	// res.send('Hello ' + JSON.stringify(req.session));
// 	// req.session.destroy();
// 	req.session.userName = 'test';
// 	res.send('Hello ' + JSON.stringify(req.session));
// });
// app.get('/check-test', function(req, res) {
// 	// req.session.userName = 'test';
// 	// res.send('Hello ' + JSON.stringify(req.session));
// 	// req.session.destroy();
// 	req.session.userName = 'test';
// 	res.send('Hello ' + JSON.stringify(req.session));
// });
app.get('/test', async (req, res) => {
	const users = await user.find({
	});
	res.send(JSON.stringify(users));
});
const Application = require('./app');
new Application(app);
app.use((req, res, next) => {
	mongoose.connection.close()
	next();
});
app.listen('3000', () => {
	console.log('Server is listing on 3000');
})
