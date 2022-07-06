const express = require('express');
var fs = require('fs');
const app = express();
require('dotenv').config();
const _ = require("lodash");
const path = require('path');
const port = process.env.PORT || 8100;
const groups = require('./tags.json');
const cloudstack = require("./cloudstack")

// create swagger.json file
createSwaggerJson();

var htmlPath = path.join(__dirname, 'dist');
app.use(express.static(htmlPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'dist/index.html'))
})

app.get('/signature', (req, res) => {
    res.download('signature.py')
})

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
})

function createSwaggerJson() {
    return new Promise(async(res, rej) => {
        let doc = {
            "swagger": "2.0",
            "info": {
                "description": "Note: signature will be generated automatically if you make request from here. If you to want to create signature separately you can use <a href='signature'>this</a> script.",
                "version": "1.0.0",
                "title": 'Apache Cloudstack API'
            },
            "host": process.env.BaseUrl,
            "basePath": "/client/api",
            "schemes": [
                "https", "http"
            ],
            "paths": {},
            "tags": []
        };

        let uniqGroups = _.uniq(_.values(groups));
        uniqGroups = uniqGroups.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });

        for (let eachTag of uniqGroups) {
            doc.tags.push({name: eachTag});
        }

        // get the list api response
        let apiResponse = await cloudstack.execute();
        
        if (apiResponse) {
            apiResponse.api = _.orderBy(apiResponse.api, ['name'], ['asc']);
            for (let eachApi of apiResponse.api) {
                if (eachApi.name) {
                    doc.paths[eachApi.name] = {
                        get: {
                            operationId: eachApi.name,
                            consumes: ["application/json"],
                            produces: ["application/json"],
                            tags: groups[eachApi.name] ? [groups[eachApi.name]] : ['Misc']
                        }
                    }
                    if (eachApi.description) {
                        doc.paths[eachApi.name].get.summary = eachApi.isasync ? '(A)  ' + eachApi.description  : eachApi.description
                    }
                    if (eachApi.params && eachApi.params.length) {

                        doc.paths[eachApi.name].get.parameters = []

                        for (let eachApiParam of eachApi.params) {

                            if (eachApiParam.name) {
                                let obj = {
                                    name: eachApiParam.name,
                                    in: "query",
                                    required: eachApiParam.required ? eachApiParam.required : false
                                }
                                obj.description = eachApiParam.description ? eachApiParam.description : ''
                                
                                if (eachApiParam.type) {
                                    obj.type = eachApiParam.type == 'uuid' ? 'string' : eachApiParam.type
                                }
                                
                                if (eachApiParam.length) {
                                    obj.description =  obj.description + ". Max length should not exceed " + eachApiParam.length + "."
                                }
                                doc.paths[eachApi.name].get.parameters.push(obj)
                            }
                        }

                        // Adding apiKey and secretKey by default for all the API
                        doc.paths[eachApi.name].get.parameters.push({
                            name: "apiKey",
                            in: "query",
                            required: true,
                            type: "string"
                        })

                        doc.paths[eachApi.name].get.parameters.push({
                            name: "secretKey",
                            in: "query",
                            required: true,
                            type: "string",
                            description: "Note: Your secret key is confidential. It will not be transferred over the Internet and will not leave your browser."
                        })
                    }
                    if (eachApi.response && eachApi.response.length) {
                        doc.paths[eachApi.name].get.responses = {
                            "200": {
                                schema: {
                                    type: "array",
                                    items: {
                                        properties: {}
                                    }
                                }
                            },
                            "401": {
                                "description": "Unable to verify user credentials and/or request signature"
                            } 
                        }
                        for (let eachApiRes of eachApi.response) {
                            if (eachApiRes.name) {
                                doc.paths[eachApi.name].get.responses['200'].schema.items.properties[eachApiRes.name] = {
                                    description : eachApiRes.description ? eachApiRes.description : '',
                                }
                                if (eachApiRes.type) {
                                    doc.paths[eachApi.name].get.responses['200'].schema.items.properties[eachApiRes.name].type = eachApiRes.type
                                }
                                if (eachApiRes.response) {
                                    Object.assign(doc.paths[eachApi.name].get.responses['200'].schema.items.properties[eachApiRes.name] , readNestedResponse(eachApiRes.response))
                                } 
                            }
                        }
                    }
                }
            }

            fs.writeFile('./dist/swagger.json', JSON.stringify(doc), function (err) {
                if (err) console.log('Error in writeFile : ', err)
                else console.log('Generated swagger.json!');
            });
        }
        res(null)
    });
}

function readNestedResponse (response) {
    let payload = {
        type: "object",
        properties: {}
    }
    for (let each of response) {
        payload.properties[each.name] = {
            description: each.description ? each.description : '',
            type: each.type
        }
        if (each.response) {
            Object.assign(payload.properties[each.name], readNestedResponse(each.response))
        }
    }
    return payload
}