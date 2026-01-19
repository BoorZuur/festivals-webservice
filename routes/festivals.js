import express from 'express';
import Festival from '../models/Festival.js';
import {faker} from '@faker-js/faker';

const router = express.Router();

//validation
function validateFestivalBody(body) {
    const errors = [];

    // name
    if (!body.name || (typeof body.name === 'string' && body.name.trim() === '')) {
        errors.push({field: 'name', message: 'Name is required'});
    }

    // description
    if (!body.description || (typeof body.description === 'string' && body.description.trim() === '')) {
        errors.push({field: 'description', message: 'Description is required'});
    }

    // review
    if (body.review == null || isNaN(body.review)) {
        errors.push({field: 'review', message: 'Review must be a number'});
    }

    return errors.length ? errors : null;
}

//OPTIONS handlers
router.options('/', (req, res) => {
    res.header('Allow', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Accept,Content-Type')
    res.status(204).send();
});

router.options('/:id', (req, res) => {
    res.header('Allow', 'GET,PUT,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept')
    res.status(204).send();
});

//seed db
router.post('/seed', async (req, res) => {
    const seedAmount = parseInt(req.body.amount) ?? 10
    await Festival.deleteMany({})
    for (let i = 0; i < seedAmount; i++) {
        await Festival.create({
            name: faker.music.genre() + ' Festival',
            description: faker.lorem.paragraph(),
            review: faker.number.int({min: 0, max: 10}),
            location: {
                type: 'Point',
                coordinates: [faker.location.longitude(), faker.location.latitude()]
            },
            locationType: faker.helpers.arrayElement(['park', 'countryside', 'venue', 'street', 'other']),
            imageUrl: faker.image.url(),
            hasBookmark: faker.datatype.boolean(),
            date: faker.date.future(),
            organizer: faker.company.name(),
            countryCode: faker.location.countryCode(),
            genre: [faker.music.genre(), faker.music.genre(), faker.music.genre()],
            lineup: [
                faker.music.artist(),
                faker.music.artist(),
                faker.music.artist(),
            ],
        })
    }
    res.status(201).send()
})

//get all festivals
router.get('/', async (req, res) => {
    try {
        const festivals = await Festival.find().select('name description imageUrl date locationType');
        res.json({
            items: festivals,
            _links: {
                self: {
                    href: `${req.protocol}://${req.get('host')}${req.originalUrl}`
                },
                collection: {
                    href: `${req.protocol}://${req.get('host')}/${process.env.COLLECTION_NAME}`
                },
            },
        });
    } catch (err) {
        console.error('Failed to fetch festivals:', err);
        res.status(500).json({message: 'Failed to fetch festivals'});
    }
});

//get individual festival
router.get('/:id', async (req, res) => {
    try {
        const festival = await Festival.findById(req.params.id);
        if (!festival) {
            return res.status(404).json({message: 'Not found'});
        }
        res.json(festival);
    } catch (e) {
        res.status(404).json(e);
    }
});

//create new festival
router.post('/', async (req, res) => {
    try {
        const errors = validateFestivalBody(req.body);
        if (errors) {
            return res.status(400).json({errors});
        }

        const festival = await Festival.create({
            name: req.body.name,
            description: req.body.description,
            review: req.body.review,
            location: req.body.location,
            locationType: req.body.locationType,
            imageUrl: req.body.imageUrl,
            hasBookmark: req.body.hasBookmark,
            date: req.body.date,
            organizer: req.body.organizer,
            genre: req.body.genre,
            countryCode: req.body.countryCode,
            lineup: req.body.lineup,
        });
        res.status(201).json(festival);
    } catch (e) {
        res.status(500).json(e);
    }
});

//edit festival
router.put('/:id', async (req, res) => {
    try {
        const errors = validateFestivalBody(req.body);
        if (errors) {
            return res.status(400).json({errors});
        }

        const festival = await Festival.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                description: req.body.description,
                review: req.body.review,
                location: req.body.location,
                locationType: req.body.locationType,
                imageUrl: req.body.imageUrl,
                hasBookmark: req.body.hasBookmark,
                date: req.body.date,
                organizer: req.body.organizer,
                genre: req.body.genre,
                countryCode: req.body.countryCode,
                lineup: req.body.lineup,
            },
            {new: true}
        );

        if (!festival) {
            return res.status(404).json({message: 'Not found'});
        }

        res.json(festival);
    } catch (e) {
        res.status(500).json(e);
    }
});

//delete festival
router.delete('/:id', async (req, res) => {
    try {
        const festival = await Festival.findByIdAndDelete(req.params.id);
        if (!festival) {
            return res.status(404).json({message: 'Not found'});
        }
        res.status(204).send();
    } catch (e) {
        res.status(500).json(e);
    }
});

export default router;