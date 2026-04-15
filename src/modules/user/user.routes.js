import { Router } from "express";
import * as  Controller from './user.controllers.js';
import { body } from "express-validator";
import authenticate from "./user.middleware.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));


const router = Router();

router.post('/register',
    [
        body('username').trim().exists().isString().isLength({min:2,max:20}).escape().withMessage('Enter a Valid Username'),
        body('email').trim().exists().isString().normalizeEmail().isEmail().withMessage('Enter a valid Email'),
        body('password').trim().exists().isString().isLength({min:5,max:25}).escape().withMessage('Enter a valid password')
    ],
    Controller.register);

router.post('/login',
    [   
        body('email').trim().exists().isString().normalizeEmail().isEmail().withMessage('Enter a valid Email'),
        body('password').trim().exists().isString().isLength({min:5,max:25}).escape().withMessage('Enter a valid password')
    ],
    Controller.login);

router.post('/logout',authenticate,Controller.logout);
router.post('/refresh',Controller.refresh);
router.post('/forgot-password',Controller.forgotPassword);

router.get('/login',(req,res)=>{
    res.sendFile(process.cwd()  + "/views/login.html");
});

router.get('/register',(req,res)=>{
    res.sendFile(process.cwd()  + "/views/register.html");
});

export default router;