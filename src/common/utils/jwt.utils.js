import jwt from 'jsonwebtoken'

const secret = process.env.JWT_ACCESS_SECRET;

const generateAccessToken = (payload)=>{
    return jwt.sign(payload,secret,{
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    });
}

const verifyAccessToken = (token)=>{
    return jwt.verify(token,secret);
}

const generateRefreshToken = (payload)=>{
    return jwt.sign(payload,secret,{
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '2d',
    });
}

const verifyRefreshToken = (token)=>{
    return jwt.verify(token,secret);
}

export {
    generateAccessToken,
    verifyAccessToken,
    generateRefreshToken,
    verifyRefreshToken
}