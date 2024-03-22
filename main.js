/**
 * BSD Zero Clause License
 * Copyright (C) 2023 by AquaO support@aquao.fr
 * 
 * Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING 
 * ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, 
 * DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, 
 * WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE 
 * OR PERFORMANCE OF THIS SOFTWARE.
 */

/**
 * Environment
 */
process.env.NODE_ENV = process.env.NODE_ENV || "production";
require("dotenv").config({
  path: process.env.NODE_ENV === "production" ? ".env" : `.env.${process.env.NODE_ENV}`
});

/**
 * Axios client
 */
const axios = require('axios');
const __client = axios.create({
    withCredentials: true,
    baseURL: process.env.HOST
 })

 __client.interceptors.request.use(config => {
    if(__GLOBAL.sessionId != undefined){
        config.headers['Cookie'] = process.env.SESSION_NAME + '=' + __GLOBAL.sessionId;
    }
    return config;
});

/**
 * JWT
 */
const jwt = require('jsonwebtoken');

/**
 * Run the whole thing
 */
const __GLOBAL = {
    sessionId : undefined,
    principalName : undefined
}

async function main(){
    await whoami();
    await authenticationWithJwtToken();
    await whoami();
    await logout();
    await whoami();
}

main();

// ------------- ENDPOINTS -------------------------------------------
/**
 * /api/whoami
 */
async function whoami(){

    console.log('> /api/whoami');

    await __client.get(process.env.HOST + '/api/whoami').then(response => {
        findSessionId(response);
        __GLOBAL.principalName = response.data.name;
    });

    console.log(`Principal : '${__GLOBAL.principalName}' with SESSION '${__GLOBAL.sessionId}'`);
}

/**
 * /api/public/client/aquao-authorization
 */
async function authenticationWithJwtToken(){

    console.log('> /api/public/client/aquao-authorization');
    const token = createJwtToken();
    
    await __client.get(process.env.HOST + '/api/public/client/aquao-authorization/' + token).then(response => {
        findSessionId(response);
        __GLOBAL.principalName = response.data.email;
    });

    console.log(`Principal : '${__GLOBAL.principalName}' with SESSION '${__GLOBAL.sessionId}'`);
}

/**
 * /api/logout
 */
async function logout(){

    console.log('> /api/logout');

    await __client.get(process.env.HOST + '/api/logout').then(response => {
        findSessionId(response);
        __GLOBAL.principalName = response.data.name;
    });

    console.log(`Principal : '${__GLOBAL.principalName}' with SESSION '${__GLOBAL.sessionId}'`);
}

// ------------- LIB -------------------------------------------
/**
 * Create a JWT token
 * @returns 
 */
function createJwtToken(){
    const payload = {};
    const options = {
        algorithm : 'HS256',
        expiresIn : '30m',
        issuer : process.env.JWT_ISSUER,
        subject : process.env.JWT_SUBJECT
    }
    const key = Buffer.from(process.env.JWT_KEY, 'base64');
    return jwt.sign(payload, key, options);
}

/**
 * Search a cookie named %SESSION_NAME%
 * @param {*} response 
 */
function findSessionId(response) {
    
    if(response.headers['set-cookie']){

        response.headers['set-cookie'].forEach(cookie => {
            const parts = cookie?.match(new RegExp(`(^|, )${process.env.SESSION_NAME}=([^;]+); `));
            const value = parts ? parts[2] : undefined;
            if(value != undefined){
                console.log('!! New session ID found ' + value);
                __GLOBAL.sessionId = value;
            }
        });
    }

}
