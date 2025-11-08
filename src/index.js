import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config()

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server running on port:${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Error connecting to database:  ", err);
})