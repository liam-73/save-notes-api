const express = require('express');
const multer = require('multer');
const Aws = require('aws-sdk');

const router = express.Router();

const Note = require('../src/models/note');
const auth = require('../src/middleware/auth');
const { Route53 } = require('aws-sdk');

router.post('/notes', auth, async (req, res) => {
    const body = Object.keys(req.body);
    const allowed = ['title', 'body', 'tag'];
    const isValid = body.every(key => allowed.includes(key));

    if(!isValid) return res.status(400).send();

    const note = new Note({
        ...req.body,
        user: req.user._id
    });

    try {
        await note.save();
        res.send(note);
    } catch(e) {
        res.status(500).send();
    }
});

router.get('/notes', auth, async (req, res) => {
    const sort = {};

    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    try {
        await req.user.populate({
            path: 'notes',
            options: {
                sort
            }
        });
        res.send(req.user.notes);
    } catch (error) {
        res.send(500).send();
    }
});

router.get('/notes/:tag', auth, async (req, res) => {
    try {
        const notes = await Note.find({user: req.user._id, tag: req.params.tag});
        res.send(notes);
    } catch(e) {
        res.status(500).send();
    }
});

const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
});

const filefilter = (req, file, cb) => {
    if( file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
        cb(null, true);
    } else {
        cb(null, false)
    }
};

const upload = multer({storage: storage, fileFilter: filefilter, limits: {fileSize: 5000000}});

const s3 = new Aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

router.post('/notes/image', auth, upload.single("image"), async (req, res) => {

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: req.file.originalname,
        Body: req.file.buffer,
        ACL: "public-read-write",
        ContentType: 'image/jpeg'
    };

    await s3.upload(params, async (error, data) => {
        if(error) res.status(500).send(error);

        const note = new Note({
        title: req.body.title,
        body: req.body.body,
        tag: req.body.tag,
        user: req.user._id,
        image: {
            url: data.Location
        }
    });
        await note.save();
        res.send(note);
    });
})

module.exports = router;