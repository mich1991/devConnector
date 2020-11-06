const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth')
const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const config = require('config')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')



// @route GET api/Auth
// @desc test route
// @access public
router.get('/', authMiddleware, async (req, res) => {
    try {
        // get user info from database excluding password 
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error')
    }
})

// @route   POST api/auth
// @desc    Authenticate user and get token
// @access  Public
router.post('/', [
    check('email', 'Please include valid Email')
        .isEmail(),
    check('password', 'password is required')
        .exists()

],
    async (req, res) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        console.log(req.body)

        const { email, password } = req.body

        try {
            let user = await User.findOne({ email: email });

            // If there is no user send error
            if (!user) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
            }

            // compare if passwords are match

            const isMatch = await bcrypt.compare(password, user.password)

            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
            }



            // return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }
            // change expiresIn to 3600 before deploy
            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: 360000 },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            )


        } catch (error) {
            console.error(error.message)
            res.status(500).send('Server error')
        }

    })
module.exports = router;