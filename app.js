'use strict';

const path = require("path");
const md5 = require('md5');
const user = require('./models/user');
const order = require('./models/order');
const menu = require('./models/menu');
const { check, validationResult } = require("express-validator");
const mongoose = require('mongoose');
const moment = require('moment');

class Application {
	constructor (router) {
		router.get('/', ((req, res) => {
			this.home(req, res);
		}));
		router.get('/register', ((req, res) => {
			this.register(req, res);
		}));
		router.post('/register', [
			check("name")
			.not()
			.isEmpty()
			.withMessage("Must have a Restaurant Name"),
			check("address")
			.not()
			.isEmpty()
			.withMessage("Must have an address"),
			check("mobile")
			.not()
			.isEmpty()
			.withMessage("Must have a telephone number")
			.custom(this.validateMobile),
			check("email")
			.isEmail()
			.withMessage("Must be a valid email address")
			.not()
			.isEmpty()
			.withMessage("The email field cannot be empty"),
			check("password")
			.isLength({ min: 8 })
			.withMessage("Your password should be at least 8 characters long")
			.custom(this.customPasswordValidation),
		],((req, res) => {
			this.makeRegistration(req, res);
		}));
		router.post('/login', [
			check("email")
			.isEmail()
			.withMessage("Please provide valid registered email")
			.not()
			.isEmpty()
			.withMessage("Please provide valid registered email"),
			check("password")
			.isLength({ min: 8 })
			.withMessage("Please provide valid password")
			.custom(this.customPasswordValidation),
		], ((req, res) => {
			this.login(req, res);
		}));
		router.get('/:id/dashboard', ((req, res) => {
			this.dashboard(req, res);
		}));
		// router.get('/:id/dashboard/order/:id/status', ((req, res) => {
		// 	this.getOrderStatus(req, res);
		// }));
		// router.patch('/:id/dashboard/order/:id/status', ((req, res) => {
		// 	this.updateOrderStatus(req, res);
		// }));
		router.get('/about', ((req, res) => {
			this.about(req, res);
		}));
		router.get('/:id/menu', ((req, res) => {
			this.fetchMenuDetails(req, res);
		}));
		// router.get('/:id/menu/item/:id', ((req, res) => {
		// 	this.getItemDetails(req, res);
		// }));
		router.get('/:id/menu/item', ((req, res) => {
			this.getItemPage(req, res);
		}));
		router.post('/:id/menu/item', [
			check("name")
			.not()
			.isEmpty()
			.withMessage("Must have a Item Name"),
			check("price")
			.not()
			.isEmpty()
			.withMessage("Please provide valid price")
			.isNumeric()
			.withMessage("Please provide valid Price in numbers"),
			check("isAvailable")
			.not()
			.isEmpty()
			.withMessage("Please provide valid availability status")
			.isIn(['true', 'false'])
			.withMessage("Please provide valid availability status (Available, Not Available)")
		], ((req, res) => {
			this.addNewItem(req, res);
		}));
		router.get('/:id/menu/item/:itemId/edit', ((req, res) => {
			this.getItemEditPage(req, res);
		}));

		router.post('/:id/menu/item/:itemId/edit', ((req, res) => {
			this.updateItemDetails(req, res);
		}));
		router.get('/:id/menu/item/:itemId/delete', ((req, res) => {
			this.deleteItem(req, res);
		}));
		router.get('/:id/logout', ((req, res) => {
			this.logout(req, res);
		}));
	}

	validateMobile(value) {
		const pattern = new RegExp(/[+]?1?\W*([2-9][0-8][0-9])\W*([2-9][0-9]{2})\W*([0-9]{4})(\se?x?t?(\d*))?/g);
		if (!pattern.test(value)) {
			throw new Error("Canadian telephone number required.");
		}
		return true;
	}

	customPasswordValidation(value, { req }) {
		if (value !== req.body.password_confirm) {
			throw new Error("Password should be the same as confirm password");
		}
		return true;
	}

	async closeConnection() {
		return mongoose.connection.close();
	}

	async home(req, res) {
		await this.closeConnection();
		res.render('home');
	}

	async register(req, res) {
		// console.log('reached');
		await this.closeConnection();
		res.render('registration');
	}

	async makeRegistration(req, res) {
		const errors = validationResult(req);
		let info = {};
		if (!errors.isEmpty()) {
			info = { errors: errors.array() };
			await this.closeConnection();
			res.render("registration", info);
		} else {
			const [userAlreadyExist] = await user.find({
				email: req.body.email,
			})
			if (userAlreadyExist) {
				await this.closeConnection();
				return res.render('registration', {errors: [{param: 'email', msg: 'Email already registered!!!'}]});
			}
			req.body['_id'] = new mongoose.Types.ObjectId();
			req.body.password = md5(req.body.password);
			await user.create(req.body);
			await this.closeConnection();
			res.render('home');
		}
	}

	async login(req, res) {
		try {
			// if (req.session[req.body.email] && req.session[req.body.email].expiresAt >= moment().format('X')) {
			// 	await this.closeConnection();
			// 	return res.render('dashboard', {name: req.session[req.body.email].name});
			// } else {
				const existingUser = await user.findOne({
					email: req.body.email,
					password: md5(req.body.password),
				});
				if(existingUser) {
					req.session[existingUser.id] = existingUser.toObject({ getters: true });
					req.session[existingUser.id].expiresAt = moment().add(1, 'hours').format('X');
					await this.closeConnection();
					return res.redirect(`/${existingUser.id}/dashboard`);
				} else {
					await this.closeConnection();
					return res.render('home', {errors: [{param: 'email', msg: 'Invalid Credentials!!!'}]});
				}
			// }
		} catch(err) {
			console.log(err);
			await this.closeConnection();
			return res.render('home', {errors: [{param: 'email', msg: 'Something went wrong!!!'}]});
		}

	}

	async dashboard(req, res) {
		if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
			await this.closeConnection();
			return res.render('dashboard', {id: req.params.id, name: req.session[req.params.id].name});
		} else {
			await this.closeConnection();
			res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
		}
	}

	// async getOrderStatus(req, res) {
	// 	await this.closeConnection();
	// 	console.log('reached');
	// 	res.send('Hello');
	// }

	// async updateOrderStatus(req, res) {
	// 	await this.closeConnection();
	// 	console.log('reached');
	// 	res.send('Hello');
	// }

	async about(req, res) {
		await this.closeConnection();
		res.send('This is About Page.');
	}

	async fetchMenuDetails(req, res) {
		try {
			if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
				const menuItems = await menu.find({restaurantId: req.params.id});
				await this.closeConnection();
				const menuItemsToPass = [];
				for (const menuItem of menuItems) {
					menuItemsToPass.push({
						price: menuItem.price,
						id: menuItem.id,
						description: menuItem.description,
						isAvailable: menuItem.isAvailable,
						name: menuItem.name,
					})
				}
				return res.render('menu', {id: req.params.id, name: req.session[req.params.id].name, menu: menuItemsToPass});
			} else {
				await this.closeConnection();
				res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
			}
		} catch(err) {
			console.error(err);
			await this.closeConnection();
			return res.render('home', {errors: [{param: 'email', msg: 'Something went wrong!!!'}]});
		}

	}

	// async getItemDetails(req, res) {
	// 	await this.closeConnection();
	// 	console.log('reached');
	// 	res.send('Hello');
	// }

	async getItemPage(req, res) {
		if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
			await this.closeConnection();
			return res.render('add-item', {id: req.params.id});
		} else {
			await this.closeConnection();
			res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
		}
	}

	async addNewItem(req, res) {
		try {
			const errors = validationResult(req);
			let info = {};
			if (!errors.isEmpty()) {
				info = {errors: errors.array(), id: req.params.id};
				await this.closeConnection();
				res.render("add-item", info);
			} else {
				req.body['_id'] = new mongoose.Types.ObjectId();
				req.body['restaurantId'] = req.params.id;
				await menu.create(req.body);
				const menuItems = await menu.find({restaurantId: req.params.id});
				const menuItemsToPass = [];
				for (const menuItem of menuItems) {
					menuItemsToPass.push({
						price: menuItem.price,
						id: menuItem.id,
						description: menuItem.description,
						isAvailable: menuItem.isAvailable,
						name: menuItem.name,
					})
				}
				await this.closeConnection();
				return res.render('menu', {id: req.params.id, name: req.session[req.params.id].name, menu: menuItemsToPass});
			}
		} catch(err) {
			console.error(err);
			await this.closeConnection();
			return res.render('home', {errors: [{param: 'email', msg: 'Something went wrong!!!'}]});
		}
	}

	async getItemEditPage(req, res) {
		if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
			await this.closeConnection();
			return res.render('edit-item', {id: req.params.id, itemId: req.params.itemId});
		} else {
			await this.closeConnection();
			res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
		}
	}

	async updateItemDetails(req, res) {
		if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
			await menu.update({_id:req.params.itemId}, req.body);
			const menuItems = await menu.find({restaurantId: req.params.id});
			const menuItemsToPass = [];
			for (const menuItem of menuItems) {
				menuItemsToPass.push({
					price: menuItem.price,
					id: menuItem.id,
					description: menuItem.description,
					isAvailable: menuItem.isAvailable,
					name: menuItem.name,
				})
			}
			await this.closeConnection();
			return res.render('menu', {id: req.params.id, name: req.session[req.params.id].name, menu: menuItemsToPass});
		} else {
			await this.closeConnection();
			res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
		}
	}

	async deleteItem(req, res) {
		if (req.session[req.params.id] && req.session[req.params.id].expiresAt >= moment().format('X')) {
			await menu.findOneAndDelete({_id: req.params.itemId});
			const menuItems = await menu.find({restaurantId: req.params.id});
			const menuItemsToPass = [];
			for (const menuItem of menuItems) {
				menuItemsToPass.push({
					price: menuItem.price,
					id: menuItem.id,
					description: menuItem.description,
					isAvailable: menuItem.isAvailable,
					name: menuItem.name,
				})
			}
			await this.closeConnection();
			return res.render('menu', {id: req.params.id, name: req.session[req.params.id].name, menu: menuItemsToPass});
		} else {
			await this.closeConnection();
			res.render('home', {errors: [{param: 'email', msg: 'Invalid Request!!!'}]});
		}
	}

	async logout(req, res) {
		await this.closeConnection();
		req.session.destroy();
		res.render('home');
	}
}

module.exports = Application;
