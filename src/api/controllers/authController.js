import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import asyncErrorHandler from "../helpers/asyncErrorHandler.js";
import CustomError from '../../config/CustomError.js';
import passwordResetMail from '../services/emailService.js';


const users = [
    {
        id: "1",
        username: "siya",
        email: "del.siyamittal@gmail.com",
        password: "siya12345",
        passwordResetToken: undefined,
        passwordResetTokenExpires:undefined,
    },
]

let refreshTokens = [];

const makeAccessToken = (payload) => {
    return jwt.sign({payload}, process.env.ACCESS_SECRET_KEY, {
        expiresIn: process.env.ACCESS_EXPIRES})
}

const makeRefreshToken = (payload) => {
    return jwt.sign({payload}, process.env.REFRESH_SECRET_KEY, {
        expiresIn: process.env.REFRESH_EXPIRES})
}

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        const error = new CustomError("Authorization header not present", 401);
        return next(error);
    }

    const token = authHeader.split(' ')[1];

    jwt.verify (
        token,
        process.env.ACCESS_SECRET_KEY,
        (err, user) => {
            if (err) {
                const error = new CustomError("Invalid token", 403);
                return next(error)
            }
            req.user = user
            next();
        }
    )
}

const createResetPasswordToken = (user) => {
    const resetToken = crypto.randomBytes(32).toString('hex');

    //encrypted reset token to store in db
    //store in db todo
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

    user.passwordResetToken = passwordResetToken;
    user.passwordResetTokenExpires = passwordResetTokenExpires;

    return resetToken
}

export const refresh = (req, res, next) => {
        const {username, password, refreshToken} = req.body;

        if (!refreshToken) {
            return res.status(401).json("User is not authenticated.");
        }

        //check if refresh token in db
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json("Refresh token not valid");
        }

        jwt.verify(refreshToken,
            process.env.REFRESH_SECRET_KEY,
            (err, user) => {

                if (err) {
                    const error = new CustomError("Refresh token not verfied", 500);
                    return next(error);
                }

                //invalidate refresh token in db
                refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

                const newAccessToken = makeAccessToken(user.username);
                const newRefreshToken = makeRefreshToken(user.username);

                //add new refresh token to db
                refreshTokens.push(newRefreshToken);

                res.status(200).json({
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                })
            });
}

export const signup = asyncErrorHandler(async (req, res, next) => {
    const {username, email, password} = req.body;

    if (!email || !password || !username) {
        const error = new CustomError("Please provide username, email ID and password to sign up.", 400);
        return next(error);
    }

    //todo - store user in db

    const accessToken = makeAccessToken(username);
    const refreshToken = makeRefreshToken(username);

    refreshTokens.push(refreshToken);

    res.status(201).json({
        status: 'success',
        accessToken,
        refreshToken,
        data: {
            username,
            email,
        }
    })
});

export const login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        const error = new CustomError("Please provide email ID and Password for login.", 400);
        return next(error);
    }

    //check if user exists in database with given email
    const user = users.find((user) => user.email == email);

    if (!user) {
        const error = new CustomError("No user exists with this email.", 401);
        return next(error);
    }

    if (password == user.password) {
        const accessToken = makeAccessToken(user.username);
        const refreshToken = makeRefreshToken(user.username);

        res.status(200).json({
            status: 'success',
            accessToken,
            refreshToken,
            user
        });
    } else {
        res.status(401).json({
            status: 'error',
            message: 'Password does not match.'
        });
    }
})

export const forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //get user based on post email from database
    const email = req.body.email;
    const username = req.body.username;
    const user = users.find((user) => user.email == email);

    if (!user) {
        const error = new CustomError("No user exists with this email.", 404);
        next(error);
    }

    //generate random reset token to send to user
    const resetToken = createResetPasswordToken(user);

    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetPassword/${resetToken}`;

    const mail = new passwordResetMail.passwordResetMail (username, resetUrl);

    try {
        await mail.sendTo(email);
        res.status(200).json("Password reset link successfully sent.")

    } catch(err) {
        const error = new CustomError("There was an error in sending password reset email. Please try again.", 500);
        return next(error)
    }
});

export const resetPassword = asyncErrorHandler(async (req, res, next) => {
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await users.find((user) =>
        user.passwordResetToken == token && user.passwordResetTokenExpires > Date.now());

    if (!user) {
        const error = new CustomError("Token is invalid or has expired", 400);
        next(error);
    }

    user.password = req.body.password;

    //set passwordResetToken and passwordResetTokenExpires as undefined in db
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    //login the user
    const accessToken = makeAccessToken(user.username);
    const refreshToken = makeRefreshToken(user.username);


    res.status(200).json({
        status: 'sucess',
        accessToken,
        refreshToken,
        user,
    })
})

export const logout = (req, res, next) => {
    const refreshToken = req.body.refreshToken;

    const refreshTokenFound = refreshTokens.find((otherToken) => otherToken == refreshToken);

    if (!refreshTokenFound) {
        const error = new CustomError("User not found", 404);
        return next(error);
    }

    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    res.status(200).json("Logged out successfully.");
}

