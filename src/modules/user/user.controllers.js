import pool from "../../common/config/db.js"
import { validationResult } from "express-validator";
import { createHmac, randomBytes,createHash } from "node:crypto";
import { generateAccessToken,generateRefreshToken,verifyAccessToken,verifyRefreshToken } from "../../common/utils/jwt.utils.js";
const hashToken =(token)=>createHash('sha256').update(token).digest('hex');

function createPasswordHash(password, salt){
  return createHmac("sha256", salt).update(password).digest("hex");
}

const register = async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }
    const {username,email,password} = req.body;
    const conn = await pool.connect();
    const checkSql = 'SELECT * FROM users WHERE email=$1 OR username=$2';
    const result = await conn.query(checkSql,[email,username]);
    
    if(result.rowCount>0){
        conn.release();
        return res.status(400).json({
            error:'Username or Email already in use'
        });
    }

    const salt = randomBytes(32).toString('hex');
    const hashedPassword = createPasswordHash(password,salt);

    const saveSql = 'INSERT INTO users (username,email,password,salt) VALUES ($1,$2,$3,$4)';
    
    try {
    await conn.query(saveSql,[username,email,hashedPassword,salt]);    
    } catch (error) {
        console.log(error);
        conn.release();
        return res.status(500).json({
            error:'Error Saving Data'
        });
    }
    conn.release();
    return res.status(201).json({
        message:'User Created Successfully'
    })
}

const login = async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors:errors.array()
        })
    }
    const {email,password} = req.body;
    const conn = await pool.connect();
    const  findQuery = 'SELECT * from users WHERE email=$1';
    const result = await conn.query(findQuery,[email]);

    if(result.rowCount!==1){
        conn.release();
        return res.status(404).json({
            error:"User not Found"
        });
    }

    const [user] = result.rows;
    const hashedPassword = createPasswordHash(password,user.salt);
    if(hashedPassword!==user.password){
        conn.release();
        return res.status(400).json({
            error:'Invalid Username or Password'
        });
    }

    const accessToken = generateAccessToken({id:user.id,username:user.username});
    const refreshToken = generateRefreshToken({id:user.id});
    const hashedRefreshToken = hashToken(refreshToken);

    const saveTokenQuery = 'UPDATE users SET refreshToken=$1 WHERE email=$2';
    try {
        await conn.query(saveTokenQuery,[hashedRefreshToken,email]);
    } catch (error) {
        conn.release();
        return res.status(500).json({
            errors: error
        });
    }

    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 *1000, // 7 DAYS IN MILLISECONDS
    });
    res.cookie('accessToken',accessToken,{
        httpOnly :true,
        secure: process.env.NODE_ENV === "production",
        maxAge : 15 * 60 *1000
    });

    conn.release();
    return res.status(200).json({
        message:'Login Success',
    });
}

const logout = async (req,res)=>{
    const conn = await pool.connect();
    const logoutSql = 'UPDATE users SET refreshToken=NULL WHERE id=$1';
    
    try {
      await conn.query(logoutSql,[req.user.id]);   
    } catch (error) {
        conn.release();
        return res.status(500).json({
            error:'Error Logging Out'
        })
    }

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    conn.release();
    return res.status(200).json({
        message:'Logout Successful'
    })
}

const refresh = async (req,res)=>{
 const oldRefreshToken = req.cookies?.refreshToken;
 if(!oldRefreshToken){
    return res.status(401).json({
        error:'Login'
    });
}
   let decodedToken=null;
   try {
    decodedToken = verifyRefreshToken(oldRefreshToken);
   } catch (error) {
    return res.status(401).json({
        error:'Login'
    });
   }
   const conn = await pool.connect();
   const userQuery = 'SELECT * FROM users WHERE id=$1';
   const result = await conn.query(userQuery,[decodedToken.id]);

   if(result.rowCount!==1){
    conn.release()
        return res.status(401).json({
        error:'Login'
    });
   }

   const [user]= result.rows;
   if(user.refreshtoken!==hashToken(oldRefreshToken)){
    conn.release()
    return res.status(400).json({
        error:'Invalid Token'
    })
   }

    const accessToken = generateAccessToken({id:user.id,username:user.username});
    const refreshToken = generateRefreshToken({id:user.id});
    const hashedRefreshToken = hashToken(refreshToken);
    
    const saveTokenQuery = 'UPDATE users SET refreshToken=$1 WHERE id=$2';
    try {
        await conn.query(saveTokenQuery,[hashedRefreshToken,decodedToken.id]);
    } catch (error) {
        conn.release();
        return res.status(500).json({
            errors: error
        });
    }

    res.cookie('refreshToken',refreshToken,{
        httpOnly:true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 *1000, // 7 DAYS IN MILLISECONDS
    });
    res.cookie('accessToken',accessToken,{
        httpOnly :true,
        secure: process.env.NODE_ENV === "production",
        maxAge : 15 * 60 *1000
    });

    conn.release();
    return res.status(200).json({
        message:'Refresh Success',
    });

}

const forgotPassword = async (req,res)=>{

}

export {register,login,logout,refresh,forgotPassword}