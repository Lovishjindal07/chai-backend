import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js';
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

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
    console.log(fullName, email, username, password);


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
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    });
    console.log(existedUser);
    
    if(existedUser) {
        throw new ApiError(409, "User with email or username already exists");
        
    }

    // 4.checking for images or avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image is required");
    }


    //5.uploading the images or avatar on cloudinary
    const avatar = await  uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user.id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

    // console.log(req.files);


});







export {registerUser};

