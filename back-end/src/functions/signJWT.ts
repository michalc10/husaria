// import jwt from "jsonwebtoken";
// import { config } from "../config/config";
// import Logging from "../library/Logging";


// const NAMESPACE = "Auth ";


// const signJWT = (
//   account: IAccountModel,
//   callback: (error: Error | null, token: string | null) => void
// ): void => {

//   Logging.info(NAMESPACE + `Attempting to sign token for ${account._id}`);
//   var timeSinceEpoch = new Date().getTime();
//   var expirationTime =
//     timeSinceEpoch + Number(config.token.expireTime) * 100000;
//   var expirationTimeInSeconds = Math.floor(expirationTime / 1000);

//   const id = account._id;
//   let permissions = {}
  
//   if (account.isAdmin === 'User') {
//     UserPermission.find({ userId: id })
//       .then(data => {
//         try {
//           jwt.sign(
//             {
//               idUser: account._id,
//               username: account.username,
//               role: account.isAdmin,
//               permissions: data[0]
//             },
//             config.token.refreshsecret,
//             {
//               issuer: config.token.issuer,
//               algorithm: "HS256",
//               expiresIn: expirationTimeInSeconds,
//             },
//             (error, token) => {
//               if (error) {
//                 callback(error, null);
//               } else if (token) {
//                 callback(null, token);
//               }
//             }
//           );
//         } catch (error: any) {
//           Logging.error(NAMESPACE + error.message + ' ' + error);
//           callback(error, null);
//         }
//       })
//   }
//   else {
//     AdminPermission.find({ userId: id })
//       .then(data => {
//         try {
//           jwt.sign(
//             {
//               idUser: account._id,
//               username: account.username,
//               role: account.isAdmin,
//               permissions: data[0]
//             },
//             config.token.refreshsecret,
//             {
//               issuer: config.token.issuer,
//               algorithm: "HS256",
//               expiresIn: expirationTimeInSeconds,
//             },
//             (error, token) => {
//               if (error) {
//                 callback(error, null);
//               } else if (token) {
//                 callback(null, token);
//               }
//             }
//           );
//         } catch (error: any) {
//           Logging.error(NAMESPACE + error.message + ' ' + error);
//           callback(error, null);
//         }
//       })
//   }

//   //

//   //
// };


// export default signJWT;




