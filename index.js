import mongoose from "mongoose";
import express from "express";
import festivalsRouter from "./routes/festivals.js";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import requireAcceptJson from "./middleware/requireAcceptJson.js";
import cors from "./middleware/cors.js";

try {
    const app = express();

    await mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB_NAME}`, {
        serverSelectionTimeoutMS: 3000
    });

    //Middleware to support application/json Content-Type
    app.use(express.json());

    //Middleware to support application/x-www-form-urlencoded
    app.use(express.urlencoded({extended: true}));

    //Middleware to only allow requests with a valid accept header
    app.use(requireAcceptJson);

    //Middleware to allow CORS
    app.use(cors);

    app.get('/', (req, res) => {
        res.json({message: 'Welkom bij de Festivals Webservice, gebruik /festivals om festivals te bekijken!'});
    })
    app.use('/', profileRouter);
    app.use('/', authRouter);
    app.use('/festivals', festivalsRouter);

    app.listen(process.env.EXPRESS_PORT, () => {
        console.log(`Server draait op ${process.env.EXPRESS_PORT}`);
    });
} catch (e) {
    console.log("oopsie", e);
}