import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);
        console.log(`\nMONGODB CONNECTED !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Error connecting Database", error);
        process.exit(1) 
    }
}

export default connectDB;