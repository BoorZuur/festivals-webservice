import express from 'express';
import Festival from '../models/Festival.js';
import {faker} from '@faker-js/faker';
import {verifyToken} from '../middleware/auth.js';

const router = express.Router();

//validation
function validateFestivalBody(body) {
    try {
        const errors = [];

        // name
        if (!body.name || (typeof body.name === 'string' && body.name.trim() === '')) {
            errors.push('Name is required');
        }

        // description
        if (!body.description || (typeof body.description === 'string' && body.description.trim() === '')) {
            errors.push('Description is required');
        }

        // review
        if (!body.review || body.description.trim() === '') {
            errors.push('Review is required');
        } else if (isNaN(body.review)) {
            errors.push('Review must be a number');
        }

        return errors.length ? errors.join(', ') : null;
    } catch (error) {
        return 'Validation error occurred';
    }
}

//OPTIONS handlers
router.options('/', (req, res) => {
    res.header('Allow', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Accept,Content-Type')
    res.status(204).send();
});

router.options('/:id', (req, res) => {
    res.header('Allow', 'GET,PUT,PATCH,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type,Accept')
    res.status(204).send();
});

//seed db
const seed = async (req, res) => {
    const seedAmount = isNaN(req.body.amount) ? 10 : parseInt(req.body.amount);
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
}

//get all festivals
router.get('/', async (req, res) => {
    try {
        //filtering logic
        const filters = req.query || {};
        const validFields = ['hasBookmark', 'organizer', 'countryCode'];
        Object.keys(filters).forEach(key => {
            if (!validFields.includes(key)) {
                delete filters[key];
            }
        });

        //pagination logic
        const totalItems = await Festival.countDocuments(filters);
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || totalItems;
        const startIndex = (page - 1) * limit;
        const totalPages = Math.ceil(totalItems / limit);
        const previousPage = page > 1 ? page - 1 : null;
        const nextPage = page < totalPages ? page + 1 : null;

        const festivals = await Festival.find(filters).skip(startIndex).limit(limit).select('name description imageUrl date locationType hasBookmark');
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
            pagination: {
                currentPage: page,
                currentItems: festivals.length,
                totalPages: totalPages,
                totalItems: totalItems,
                _links: {
                    first: {
                        page: 1,
                        href: totalPages === 1
                            ? `${req.protocol}://${req.get('host')}${req.originalUrl}`
                            : `${req.protocol}://${req.get('host')}${req.baseUrl}?page=1&limit=${limit}`
                    },
                    last: {
                        page: totalPages,
                        href: totalPages === 1
                            ? `${req.protocol}://${req.get('host')}${req.originalUrl}`
                            : `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${totalPages}&limit=${limit}`
                    },
                    previous: previousPage ? {
                        page: previousPage,
                        href: `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${previousPage}&limit=${limit}`
                    } : null,
                    next: nextPage ? {
                        page: nextPage,
                        href: `${req.protocol}://${req.get('host')}${req.baseUrl}?page=${nextPage}&limit=${limit}`
                    } : null,
                }
            }
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
        const ifModifiedSince = req.header('If-Modified-Since');
        const lastModified = festival ? festival.updatedAt || festival.createdAt : null;
        if (lastModified) {
            res.setHeader('Last-Modified', lastModified.toUTCString());
        }
        if (ifModifiedSince && lastModified && new Date(ifModifiedSince) >= lastModified) {
            return res.status(304).send();
        }
        if (!festival) {
            return res.status(404).json({message: 'Not found'});
        }
        res.json(festival);
    } catch (e) {
        res.status(404).json(e);
    }
});

//post router for custom methods
const postRouter = async (req, res) => {
    switch (req.body.method) {
        case 'SEED':
            // Apply JWT verification for SEED method
            verifyToken(req, res, async () => {
                await seed(req, res);
            });
            break;
        default:
            res.status(400).json({error: 'Invalid method'});
    }
}

//create new festival or custom method
router.post('/', async (req, res) => {
    try {
        // check if method is in body
        if (req.body.method) {
            return postRouter(req, res)
        }

        const errors = validateFestivalBody(req.body);
        if (errors) {
            return res.status(400).json({error: errors});
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
            return res.status(400).json({error: errors});
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

// partial update festival
router.patch('/:id', async (req, res) => {
    try {
        if (req.body.name === '' || req.body.description === '' || req.body.review === '') {
            return res.status(400).json({error: 'Name, description and review cannot be empty'});
        }

        const festival = await Festival.findByIdAndUpdate(
            req.params.id,
            req.body,
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