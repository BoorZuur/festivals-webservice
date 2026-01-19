import mongoose from "mongoose";

const festivalSchema = new mongoose.Schema({
        name: {type: String, required: true},
        description: {type: String, required: true},
        review: {type: Number, required: true},
        location: {type: {type: String}, coordinates: [Number]},
        locationType: {type: String, enum: ['park', 'countryside', 'venue', 'street', 'other'], default: 'other'},
        imageUrl: {type: String, default: 'https://placehold.co/600x400/png?text=No+Image'},
        hasBookmark: {type: Boolean, default: false},
        date: {type: Date, default: Date.now},
        organizer: {type: String},
        countryCode: {type: String, default: 'nl'},
        genre: {type: [String]},
        lineup: {type: [String]},
    },
    {
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (doc, ret) => {
                const port = process.env.EXPRESS_PORT;
                const url = process.env.EXPRESS_URL;
                const collection = process.env.COLLECTION_NAME;
                const id = doc && doc._id ? doc._id.toString() : ret.id || '';

                ret._links = {
                    self: {
                        href: `${url}:${port}/${collection}/${id}`,
                    },
                    collection: {
                        href: `${url}:${port}/${collection}`,
                    },
                };

                delete ret._id;
            },
        },
    });

const Festival = mongoose.model("Festival", festivalSchema);

export default Festival;