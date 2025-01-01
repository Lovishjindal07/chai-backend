import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from "../models/user.mo2del.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken}

    } catch(error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access Token");
    }
};

const registerUser = asyncHandler( async (req, res) => {

    //get user details from frontend
    //validation - not empty
    //check if user already exists : username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response 
    //check for user creation
    // return response

    // 1.taking data from frontend.
    const {fullName, email, username, password } = req.body;
    // console.log(fullName, email, username, password);


    // 2.validation-checking fields that they are empty or not.
    // if(fullName === "") {
    //     throw new ApiError(404, "fullName is required");
    // }

    if(
        [fullName, email, username, password].some((field) =>field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    //3. checking if user already exists or not.
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    });
    // console.log(existedUser);
    
    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists");
        
    }

    // 4.checking for images or avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    //5.uploading the images or avatar on cloudinary
    const avatar = await  uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 6.create user object-entry in database
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // 7.removing password and refresh token field from reponse
    const createdUser = await User.findById(user.id).select(
        "-password -refreshToken"
    )

    //8.checking for user creation
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    
    // 9.return response to user
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

    // console.log(req.files);


});

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    //username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    // 1. req.body -> data
    const {email, username, password} = req.body;

    // 2.checking for username || email
    if(!username || !email) {
        throw new ApiError(400, "Username or Email is required");
    }

    // 3. finding the user in database
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 4.password checking
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentails");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = User.findById(user._id).
    select("-password -refreshToken")

    const options = {
        httpOnly: true,   //to modify cookies only from server side
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200, {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    ))


});

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new : true
        }
    )

    const options = {  //so that we can make change in cookies only from server side
        httpOnly: true, 
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})





export {registerUser,loginUser, logoutUser};

