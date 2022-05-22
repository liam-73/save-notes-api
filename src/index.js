require('dotenv').config();
const express = require('express');
require('./db/mongoose')


const app = express();
const port = process.env.PORT;


// routes
const userRouter = require('../routers/user');
const noteRouter = require('../routers/note');

// app.use();
app.use(express.json());
app.use(userRouter);
app.use(noteRouter);

app.listen(port, () => {
    console.log('server is up on port ' + port);
});
