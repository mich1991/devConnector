const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')

// need a middleware to get token
const authMiddleware = require('../../middleware/auth')
const Profile = require('../../models/Profile')
const User = require('../../models/User')

// @route   GET api/Profile/me
// @desc    Get current profile based on token 
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' })
        }

        res.json(profile)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

// @route   Post api/Profile
// @desc    Create || Update user profile  
// @access  Private
router.post('/', [
    authMiddleware,
    check('status', 'Status is required')
        .not()
        .isEmpty(),
    check('skills', 'Skills are required')
        .not()
        .isEmpty()
], async (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin,
    } = req.body

    // Build profile object
    const profileFields = {}
    profileFields.user = req.user.id;
    if (company) profileFields.company = company
    if (website) profileFields.website = website
    if (location) profileFields.location = location
    if (bio) profileFields.bio = bio
    if (status) profileFields.status = status
    if (githubusername) profileFields.githubusername = githubusername
    if (skills) {
        // convert skills into array and trim white space.
        profileFields.skills = skills.split(',').map(skill => skill.trim())
    }

    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube
    if (twitter) profileFields.social.twitter = twitter
    if (facebook) profileFields.social.facebook = facebook
    if (linkedin) profileFields.social.linkedin = linkedin
    if (instagram) profileFields.social.instagram = instagram

    try {
        let profile = await Profile.findOne({ user: req.user.id })

        if (profile) {
            // Profile exist already so we want to Update
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileFields },
                { new: true }
            )
            return res.json({ profile })
        }
        // If profile don't exist Create
        profile = new Profile(profileFields)

        await profile.save()
        res.json(profile)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server error')
    }

})


// @route   Get api/Profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar'])
        res.json(profiles)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

// @route   Get api/Profile/user/:user_id
// @desc    Get all profiles
// @access  Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])

        if (!profile) return res.status(400).json({ msg: 'Profile not found' })

        res.json(profile)
    } catch (error) {
        console.error(error.message)
        if (error.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.status(500).send('Server Error')
    }
})

// @route   delete api/Profile
// @desc    delete profile , user & posts
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
    try {
        // @todo - remove user posts

        // Remove profile
        await Profile.findOneAndRemove({ user: req.user.id })

        // Remove user
        await User.findOneAndRemove({ _id: req.user.id })


        res.json({ msg: 'User deleted' })
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})


// @route   PUT api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.put('/experience', [
    authMiddleware,
    [
        check('title', 'Title is required')
            .not()
            .isEmpty(),
        check('company', 'Company is required')
            .not()
            .isEmpty(),
        check('from', 'From Date is required')
            .not()
            .isEmpty(),
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).send({ errors: errors.array() })
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    try {
        const profile = await Profile.findOne({ user: req.user.id })
        // UNSHIFT because -> Add the latest experience at the begginig of array. 
        profile.experience.unshift(newExp)
        // save changes
        await profile.save()

        res.json(profile)
    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

// @route   DELETE api/profile/experience/:exp_id
// @desc    delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', authMiddleware, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        // Get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)

        profile.experience.splice(removeIndex, 1)

        await profile.save()

        res.json(profile)

    } catch (error) {
        console.error(error.message)
        res.status(500).send('Server Error')
    }
})

module.exports = router;