import dotenv from'dotenv'

dotenv.config();


const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
// const MONGO_URL = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@libraryttsw.uj6z4rr.mongodb.net/Node-API`;
// const MONGO_URL = 'mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@husary.xbvzelo.mongodb.net/Node-API';
const MONGO_URL = 'mongodb+srv://michalc10:polska1101@husary.xbvzelo.mongodb.net/Node-API';

const SERVER_HOSTNAME = process.env.SERVER_HOSTNAME || 'localhost';
const SERVER_TOKEN_EXPIRETIME = process.env.SERVER_TOKEN_EXPIRETIME || 3600;
const SERVER_TOKEN_ISSUER = process.env.SERVER_TOKEN_ISSUER || 'coolIssuer';
const SERVER_REFRESH_TOKEN_SECRET = process.env.SERVER_REFRESH_TOKEN_SECRET || 'superencryptedsecretrefreshtoken';
const SERVER_TOKEN_SECRET = process.env.SERVER_TOKEN_SECRET || 'superencryptedsecret';

const SERVER_PORT = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000;


export const config ={
    mongo:{
        url:MONGO_URL
    },
    server:{
        port:SERVER_PORT
    },
    token: {
        expireTime: SERVER_TOKEN_EXPIRETIME,
        issuer: SERVER_TOKEN_ISSUER,
        refreshsecret: SERVER_REFRESH_TOKEN_SECRET,
        secret: SERVER_TOKEN_SECRET
    }
}


