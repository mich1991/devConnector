const express = require('express')
const connectDB = require('./config/db')
const app = express()

// connect Database
connectDB();

// init Middleware - bodyparser 
app.use(express.json({ extended: false }))

// define routes
app.use('/api/users', require('./routes/api/users'))
app.use('/api/auth', require('./routes/api/auth'))
app.use('/api/profile', require('./routes/api/profiles'))
app.use('/api/posts', require('./routes/api/posts'))


const PORT = process.env.PORT || 5000

app.get('/', (req, res) => {
    res.send('API is running')
})

app.listen(PORT, () => console.log('Server is running on port:', PORT))