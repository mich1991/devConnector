const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

const User = require('../../models/User')

// @route POST api/users
// @desc Register user 
// @access public
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include valid Email')
        .isEmail(),
    check('password', 'Please enter password with minimum 6 characters')
        .isLength({ min: 6 })

],
    async (req, res) => {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        console.log(req.body)

        const { name, email, password } = req.body

        try {
            let user = await User.findOne({ email: email });

            // See if User exist
            if (user) {
                return res.status(400).json({ errors: [{ msg: "User already exist" }] })
            }


            // Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })

            user = new User({
                name,
                email,
                password,
                avatar
            })
            // Encrypt password
            const salt = await bcrypt.genSalt(10)

            user.password = await bcrypt.hash(password, salt)

            await user.save()

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