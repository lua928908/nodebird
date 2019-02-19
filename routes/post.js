const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Post, Hashtag, User } = require('../models/index');
const { isLoggedIn, } = require('./middlewares');
const router = express.Router();

const upload = multer({
	// storage : 어디에 저장할지
	storage: multer.diskStorage({
		// 파일이 저장될 경로
		destination(req, file, cb){ // cb -> callback을 의미를
			cb(null, 'uploads/');
		},
		// 파일의 이름을 지정
		filename(req, file, cb){
			const ext = path.extname(file.originalname);
			cb( null, path.basename(file.originalname, ext) + new Date().valueOf() + ext )
		}
	}),
	// limit: 파일사이즈(바이트 단위)
	limit: { fileSize: 5*1024 * 1024 }, // 5MB 까지 업로드가능
});
router.post('/img', isLoggedIn, upload.single('img'), (req, res, next)=>{ // upload.single('img') -> 파일을 올리는 input태그의 id값
	// 보통 form을통해 요청을 보내면 req.body에 담기게되는데 multer를 이용해 이미지를 올리면 req.file에 담긴다.
	console.log(req.file);
	res.json({ url: `/img/${req.file.filename}` });
});

const upload2 = multer();
router.post('/', isLoggedIn, upload2.none(), async (req, res, next)=>{
	try{
		const post = await Post.create({
			content: req.body.content,
			img: req.body.url,
			userId: req.user.id,
		});
		const hashtags = req.body.content.match(/#[^\s]*/g)
		if(hashtags){
			// findOrCreate -> DB에있으면 가져오고 없으면 새로생성
			const result = await Promise.all(hashtags.map(tag=>Hashtag.findOrCreate({
				where: { title: tag.slice(1).toLowerCas() },
			})));
			await post.addHashtags(result.map( r=>r[0] ));
		}
		res.redirect('/');
	}catch(error){
		console.error(error);
		next(error);
	}
});

router.delete('/:id', async (req, res, next)=>{
	try{
		await Post.destroy({ where: { id: req.params.id, userId: req.user.id } });
		res.send('OK');
	}catch(error){
		console.error(error);
		next(error);
	}
});

router.get('/hashtag', async ()=>{
	const query = req.query.hashtag;
	if(!query){
		return res.redirect('/');
	}
	try{
		const hashtag = await Hashtag.find({ where: { title: query } });
		let posts = [];
		if(hashtag){
			posts = await hashtag.getPosts({ include: [{ model: User }] });
		}
		return res.render('main', {
			title: `${query} || NodeBird`,
			user: req.user,
			twits: posts,
		});
	}catch(error){
		console.error(error);
		next(error);
	}
});

router.post('/:id/like', async (req, res, next)=>{
	try{
		const post = await Post.find({ where: { id: req.params.id } })
		await post.addLiker(req.user.id )
		res.send('OK');
	}catch(error){
		console.error(error);
		next(error);
	}
});

router.delete('/:id/like', async (req, res, next)=>{
	try{
		const post = await Post.find({ where: { id: req.params.id } })
		await post.removeLiker(req.user.id )
		res.send('OK');
	}catch(error){
		console.error(error);
		next(error);
	}
})

module.exports = router;

/*
	destination: 파일경로
	filename: 파일명
	cb: 에러,결과값

	single: 이미지 하나(필드명)
	array: 이미지 여러개(단일필드)
	fields: 이미지 여러개(여러필드)
	none: 이미지 X
*/