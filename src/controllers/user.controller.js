import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiRespone.js";

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return { refreshToken, accessToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong generating Access/Refresh Token");
    }
}

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
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if(existedUser) {
        throw new ApiError(409, "Email or username already in use");
    }

    //check avatar, image
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(coverImageLocalPath && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

 
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

const loginUser = asyncHandler( async(req,res) => {

    //accept credentials from req body
    const {username, email, password} = req.body;

    //username or email
    if(!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }

    //find user
    const user = await User.findOne({
        $or: [{username},{email}]
    });

    if(!user) {
        throw new ApiError(404,"User not found");
    }

    //verify credentials by password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credentials");
    }

    //generate token and give back access and refresh
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    //send cookies
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
                new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };
    
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
})

export { registerUser, loginUser, logoutUser };