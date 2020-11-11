const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')

// bring all models
const Post = require('../../models/Post')
const User = require('../../models/User')
const Profile = require('../../models/Profile');
const { route } = require('./profiles');

// @route POST api/Posts
// @desc  Create a post
// @access Private
router.post('/', [
    authMiddleware,
    [
        check('text', 'Text is required')
            .not()
            .isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    try {
        const user = await User.findById(req.user.id).select('-password')
        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        const post = await newPost.save()

        res.json(post)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }



})

// @route GET api/Posts
// @desc  Get all posts
// @access Private
router.get('/', authMiddleware, async (req, res) => {
    try {
        const post = await Post.find().sort({ date: -1 })
        res.json(post)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }

})

// @route GET api/Posts/:post_id
// @desc  Get a single post
// @access Private
router.get('/:post_id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id)
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }

        res.json(post)
    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error')
    }

})

// @route DELETE api/Posts/:post_id
// @desc  Delete a single post
// @access Private
router.delete('/:post_id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id)

        if (!post) {
            return res.status(404).json({ msg: 'Post not found' })
        }


        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' })
        }

        await post.remove()

        res.json({ msg: 'post deleted' })
    } catch (error) {
        console.error(error.message)
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' })
        }
        res.status(500).send('Server Error')
    }

})


module.exports = router;