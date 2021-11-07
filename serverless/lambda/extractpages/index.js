const AWS = require('aws-sdk');
let fs = require('fs');
let s3 = new AWS.S3();
const BUCKETNAME = '';

function makeResponse(statusCode, body) {
    const response = {
        statusCode: statusCode,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Origin':'*'
        },
        body: body
    };
    return response;
}

let getFile = async (key) => {
    let response;

    await s3.getObject({
        Key: key,
        Bucket: BUCKETNAME
    }).promise()
    .then((data) => {
        response = data;
    }).catch((error) => {
        console.log(error);
    })

    return response;
}

let downloadToTemp = async (inputPath, fileContent) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(inputPath, fileContent.Body, (fserr) => {
            if (fserr) {
                console.log(fserr);
                reject(fserr)
            } else {
                resolve();
            }
        })
    });
}

let extractPages = async (inputPath, outputPath, range) => {
    return new Promise((resolve, reject) => {
        let command = 'gs -dNOPAUSE -dQUIET -dBATCH' + 
        ' -sDEVICE=pdfwrite';

        if (range.startPage != 0) {
            command += ' -dFirstPage=' + range.startPage;
        }

        if (range.endPage != 0) {
            command += ' -dLastPage=' + range.endPage;
        }

        command += ' -sOutputFile="' + outputPath +  
        '" "' + inputPath + '"';
        
        let exec = require('child_process').exec, child;
        child = exec(command, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                let response = makeResponse(502, JSON.stringify({message: 'Error with exec'}));
                reject(response);
            } else {
                resolve();
            }
        })
    })
}

let uploadFile = async (filename, outputPath, contentType) => {
    let response;
    let folder = parseInt(Math.random() * 100000, 10);
    let newkey = 'files/output/' + folder.toString()  + '/' + filename;
    await s3.putObject({
        Bucket: BUCKETNAME,
        Key: newkey,
        Body: fs.createReadStream(outputPath),
        ContentType: contentType
    }).promise()
    .then((data) => {
        response = makeResponse(200, JSON.stringify({
            newkey: newkey
        }))
    }).catch((error) => {
        console.log(error);
    })
    return response;
}

let removeLocalFiles = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;
        let command = 'rm "' + inputPath + '" "' + outputPath + '"';
        child = exec(command, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log(stderr);
                let response = makeResponse(502, JSON.stringify({message: 'Error with exec'}));
                reject(response);
            } else {
                resolve();
            }
        })
    })
}

let main = async (key, range) => {
    let key_split = key.split('/');
    let filename = key_split[key_split.length - 1];
    let inputPath = '/tmp/i-' + filename;
    let outputPath = '/tmp/o-' + filename;
    let fileContent = await getFile(key);
    await downloadToTemp(inputPath, fileContent);
    await extractPages(inputPath, outputPath, range);
    let response = await uploadFile(filename, outputPath, 'application/pdf');
    await removeLocalFiles(inputPath, outputPath);
    return response;
}

exports.handler = async (event) => {
    let eventBody = JSON.parse(event.body);
    let key = eventBody.key;
    console.log(key);
    let startPage = (eventBody.startPage != '') ? parseInt(eventBody.startPage, 10) : 0;
    let endPage = (eventBody.endPage != '') ? parseInt(eventBody.endPage, 10) : 0;
    let range = {
        startPage: startPage,
        endPage: endPage
    }
    return await main(key, range);
};
