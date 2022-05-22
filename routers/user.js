const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');

const router = new express.Router();

const User = require('../src/models/user');
const auth = require('../src/middleware/auth')

router.post('/register', async (req, res) => {
    validEmail = validator.isEmail(req.body.email.toLowerCase());

    if(!validEmail) return res.status(400).send({error: "Invalid Email!"});

    if(req.body.age) {
        if(req.body.age < 0 ) return res.status(400).send({error: "Age must be positive"})
    }

    const user = new User(req.body);

    try {
        await user.save();     
        res.status(201).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({email: req.body.email});

        if(!user) throw new Error("There's no user with this account!");

        const isMatch = bcrypt.compare(req.body.password, user.password);

        if(!isMatch) throw new Error("Wrong password");

        const token = await user.AuthToken();
        res.send({user, token});
    } catch(error) {
        res.status(500).send();
    }
});

router.get('/profile', auth, async (req, res) => {
    res.send(req.user)
});

router.patch('/profile', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidUpdate = updates.every(update => allowedUpdates.includes(update));

    if(!isValidUpdate) {
        return res.status(400).send({error: 'Invalid update!'});
    }

    try {
        updates.forEach(update => req.user[update] = req.body[update]);

        await req.user.save();

        res.send(req.user);
    } catch (error) {
        res.status(500).send();
    }
})

router.get('/users', async (req, res) => {
    try{
        const users = await User.find({});
        
        res.send(users);
    } catch (error) {
        res.status(500).send();
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById({_id: req.params.id});
        
        if(!user) {
            return res.status(404).send({error: "User not found!"})
        };

        res.send(user);
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router;