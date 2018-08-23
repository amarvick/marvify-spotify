'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const express = require('express');
const app = express();
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const fs = require('fs');
const chalk = require('chalk');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const paths = require('../config/paths');
const config = require('../config/webpack.config.dev');
const createDevServerConfig = require('../config/webpackDevServer.config');

const useYarn = fs.existsSync(paths.yarnLockFile);
const isInteractive = process.stdout.isTTY;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(`Learn more here: ${chalk.yellow('http://bit.ly/2mwWSwH')}`);
  console.log();
}

// We attempt to use the default port but if it is busy, we offer the user to
// run on a different port. `choosePort()` Promise resolves to the next free port.
choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    if (port == null) {
      // We have not found a port.
      return;
    }
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;
    const urls = prepareUrls(protocol, HOST, port);
    // Create a webpack compiler that is configured with custom messages.
    const compiler = createCompiler(webpack, config, appName, urls, useYarn);
    // Load proxy config
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(proxySetting, paths.appPublic);
    // Serve webpack assets generated by the compiler over a web sever.
    const serverConfig = createDevServerConfig(
      proxyConfig,
      urls.lanUrlForConfig
    );
    const devServer = new WebpackDevServer(compiler, serverConfig);
    // Launch WebpackDevServer.
    devServer.listen(port, HOST, err => {
      if (err) {
        return console.log(err);
      }
      if (isInteractive) {
        clearConsole();
      }
      console.log(chalk.cyan('Starting the development server...\n'));
      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function(sig) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch(err => {
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });

// const client_id = 'cbd995e92f6a41679d8fe86b239bbbcf';
// const client_secret = '450dae33d7674ca8a425224b82bc66c1';
// const redirect_uri = 'http://localhost:3000/callback/';
// const appUrl = 'https://am-spotify-quiz.herokuapp.com/#'

// /**
//  * Generates a random string containing numbers and letters
//  * @param  {number} length The length of the string
//  * @return {string} The generated string
//  */
// const generateRandomString = function(length) {
//   const text = '';
//   const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

//   for (const i = 0; i < length; i++) {
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return text;
// };

// const stateKey = 'spotify_auth_state';

// const app = express();

// app.use(express.static(__dirname + '/authorization_code/public'))
//    .use(cors())
//    .use(cookieParser());

// app.get('/login', function(req, res) {

//   const state = generateRandomString(16);
//   res.cookie(stateKey, state);

//   // your application requests authorization
//   const scope = 'user-read-private user-read-email user-read-playback-state user-top-read playlist-modify-public playlist-modify-private user-modify-playback-state user-read-playback-state';
//   res.redirect('https://accounts.spotify.com/authorize?' +
//     querystring.stringify({
//       response_type: 'code',
//       client_id: client_id,
//       scope: scope,
//       redirect_uri: redirect_uri,
//       state: state
//     }));
// });

// app.get('/callback/', function(req, res) {

//   // your application requests refresh and access tokens
//   // after checking the state parameter

//   const code = req.query.code || null;
//   const state = req.query.state || null;
//   const storedState = req.cookies ? req.cookies[stateKey] : null;

//   if (state === null || state !== storedState) {
//     res.redirect(appUrl +
//       querystring.stringify({
//         access_token: access_token,
//         refresh_token: refresh_token
//       }));
//   } else {
//     res.clearCookie(stateKey);
//     const authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       form: {
//         code: code,
//         redirect_uri: redirect_uri,
//         grant_type: 'authorization_code'
//       },
//       headers: {
//         'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')),
//       },
//       json: true
//     };
    
//     request.post(authOptions, function(error, response, body) {
//       if (!error && response.statusCode === 200) {

//         const access_token = body.access_token,
//             refresh_token = body.refresh_token;

//         const options = {
//           url: 'https://api.spotify.com/v1/me',
//           headers: { 
//             'Authorization': 'Bearer ' + access_token,
//             'Content-Type': 'application/json' // May not need
//           },
//           body: { // Likely don't need this anymore!
//             'name': 'Test Playlist', 
//             'public': false
//           },
//           json: true
//         };

//         // use the access token to access the Spotify Web API
//         request.get(options, function(error, response, body) {
//           console.log(body);
//         });

//         // we can also pass the token to the browser to make requests from there
//         res.redirect(appUrl +
//           querystring.stringify({
//             access_token: access_token,
//             refresh_token: refresh_token
//           }));
//       } else {
//         res.redirect(appUrl +
//           querystring.stringify({
//             error: 'invalid_token'
//           }));
//       }
//     });
//   }
// });

// app.get('/refresh_token', function(req, res) {

//   // requesting access token from refresh token
//   const refresh_token = req.query.refresh_token;
//   const authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
//     form: {
//       grant_type: 'refresh_token',
//       refresh_token: refresh_token
//     },
//     json: true
//   };

//   request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       const access_token = body.access_token;
//       res.send({
//         'access_token': access_token
//       });
//     }
//   });
// });