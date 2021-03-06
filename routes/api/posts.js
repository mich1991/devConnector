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

// @route PUT api/Posts/like/:id
// @desc  Like a post
// @access Private
router.put('/like/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        // check if user already liked post
        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked' })
        }

        post.likes.unshift({ user: req.user.id })

        await post.save()
        res.json(post.likes)

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
})

// @route PUT api/Posts/unlike/:id
// @desc  Remove like from a post
// @access Private
router.put('/unlike/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        // check if user already liked post
        if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(400).json({ msg: 'Post has not yet been liked' })
        }

        // Get removed index
        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)

        post.likes.splice(removeIndex, 1)

        await post.save()
        res.json(post.likes)

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error')
    }
})


// @route POST api/Posts/comment/:id
// @desc  Create comment on a post
// @access Private
router.post('/comment/:id', [
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
        const post = await Post.findById(req.params.id)

        const newComment = ({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id
        })

        post.comments.unshift(newComment)
        await post.save()

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

// @route DELETE api/Posts/comment/:post_id/:comment_id
// @desc  Delete comment from a post
// @access Private
router.delete('/comment/:post_id/:comment_id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id)
        // pull out comment
        const comment = post.comments.find(comment => comment.id === req.params.comment_id)

        // Make sure comment exist
        if (!comment) {
            return res.status(404).json({ msg: 'Comment does not exist' })
        }
        // Check if user created that comment.
        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' })
        }

        // Get removed index
        const removeIndex = post.comments
            .map(comment => comment._id.toString())  //if error occured try comment.user.toString()
            .indexOf(req.params.comment_id)

        post.comments.splice(removeIndex, 1)

        await post.save()

        res.json(post.comments)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

module.exports = router;