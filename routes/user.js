const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('./middlewares');
const { User } = require('../models/index');

router.post('/:id/follow', isLoggedIn, async (req, res, next)=>{
	try{
		const user = await User.find({ where: { id: req.user.id } });
		await user.addFollowing(parseInt(req.params.id, 10));
		res.send('success');
	}catch(error){
		console.error(error);
		next(error);
	}
})

router.post('/:id/unfollow', isLoggedIn, async (req, res, next)=>{
	try{
		const user = await User.find({ where: { id: req.user.id } });
		await user.removeFollowing(parseInt(req.params.id, 10));
		res.send('success');
	}catch(error){
		console.error(error);
		next(error);
	}
})

router.post('/profile', async (req, res, next)=>{
	try{
		await User.update({ nick: req.body.nick },{
			where: { id: req.user.id },
		})
		res.redirect('/profile');
	}catch(error){
		console.error(error);
		next(error);
	};
});

module.exports = router;