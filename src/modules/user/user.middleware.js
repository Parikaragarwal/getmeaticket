import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import pool from "../../common/config/db.js";
const authenticate = async (req,res,next)=>{
    let token = null;
    if(req.cookies?.accessToken){
        token = req.cookies.accessToken;
    }

    if(!token){
        return res.status(401).json({
            error:'refresh'
        });
    }
    let payload=null;
    try {
        payload = verifyAccessToken(token);
    } catch (error) {
        return res.status(401).json({
            error:'refresh'
        });
    }
    

    const conn = await pool.connect();

    const findUserSql = 'SELECT * FROM users WHERE id=$1';
    const result = await conn.query(findUserSql,[payload.id]);

    if(result.rowCount!==1)
    {
        conn.release();
        return res.status(401).json({
            error:'refresh'
        });
    }
    const [user] = result.rows;
    req.user ={
    id:user.id,
    username:user.username,
    email:user.email
    };

    conn.release();

    next();
}

export default authenticate