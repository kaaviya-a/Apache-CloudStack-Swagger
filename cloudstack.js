'use strict';

const AcsClient = require('csclient');
const _ = require("lodash");

exports.execute = function () {
    return new Promise((res, rej) => {
        try {
            const client = new AcsClient({
                baseUrl: process.env.acsUrl + '/client/api?',
                apiKey: process.env.apiKey,
                secretKey: process.env.secretKey,
                singleExecutor: false,
                pollingTime: 2000,
                pollingNumber: -1
            });

            let args = {
                response: 'json'
            }
            let command = 'listApis';
            
            let executor = 'executeSync';

            console.log('%s command received. Calling executor %s', command, executor);
            try {
                client[executor](command, args, (err, response) => {
                    if (!err) {
                        console.log('Response from cloudstack:', response);
                        res(response[command.toLowerCase() + 'response'] || response);
                    } else {
                        console.log('Error executing cloudstack command %s:', command, err);
                        res(null);
                    }
                });
            } catch (error) {
                console.log('Error while executing cloudstack command: ', error)
                res(null)
            }
           

        } catch (erro) {
            console.log('Error in cloudstack connection', erro);
            res(null)
        }
    });
}
