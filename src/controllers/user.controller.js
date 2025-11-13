import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespone.js";

const registerUser = asyncHandler( async(req,res) => {

    //get enough detail
    const {username, email, fullname, password} = req.body;

    //pass through validation - not empty
    if(
        [fullname,email,username,password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400,'All fields are required');
    }

    //check already exist
    const existedUser = User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser) {
        throw new ApiError(409, "Email or username already in use");
    }

    //check avatar, image
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
 
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avtar file required");
    }

    //upload to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    //user object:- then to db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    //remove password, refreshtoken
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    //check for user create and response
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering"); 
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export { registerUser };