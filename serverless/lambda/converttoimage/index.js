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

let countPages = async (inputPath) => {
    return new Promise((resolve, reject) => {
        let command = 'strings < ' + inputPath + ' | sed -n "s|.*/Count -\\{0,1\\}\\([0-9]\\{1,\\}\\).*|\\1|p" | sort -rn | head -n 1';
        let command2 = 'ls /tmp/| wc -l';
        console.log(command);
        let exec = require('child_process').exec, child;
        child = exec(command2, (err, stdout, stderr) => {
            if (err != null) {
                console.log(err);
                console.log('Salida (error): ' + stderr)
                let response = makeResponse(502, JSON.stringify({message: 'Error with exec'}));
                reject(response);
            } else {
                resolve(stdout);
            }
        })
    })
}

let convertToImage = async (inputPath, range, qValue, outputPath) => {
    return new Promise((resolve, reject) => {
        let command = 'gs -dNOPAUSE -dQUIET -dBATCH' + 
        ' -sDEVICE=jpeg -r' + qValue;
        if (range.startPage != 0) {
            command += ' -dFirstPage=' + range.startPage;
        }

        if (range.endPage != 0) {
            command += ' -dLastPage=' + range.endPage;
        }

        command += ' -sOutputFile=' + outputPath + ' "' + inputPath + '"';
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
        response = newkey;
    }).catch((error) => {
        console.log(error);
    })
    return response;
}

let removeLocalFiles = async (inputPath, outputArray) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;
        let command = 'rm "' + inputPath + '"';
        for (let outputPath of outputArray) {
            command += ' ' + outputPath;
        }
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

let main = async (key, range, qValue) => {
    let key_split = key.split('/');
    let filename = key_split[key_split.length - 1];
    let filenameSplit = filename.split('.');
    let filename_wo_suffix = filenameSplit[0];
    let inputPath = '/tmp/i-' + filename;
    let outputPath = '/tmp/o-page%d.jpg';
    let fileContent = await getFile(key);
    await downloadToTemp(inputPath, fileContent);
    await convertToImage(inputPath, range, qValue, outputPath);
    let pagesNumber = parseInt(await countPages(inputPath)) - 1;
    console.log('Paginas: ' + pagesNumber);
    let imageArray = [];
    let localOutputArray = [];
    let pageNumber;
    if (range.startPage != 0) {
        pageNumber = range.startPage;
    } else {
        pageNumber = 1;
    }
    for (let n = 1; n <= parseInt(pagesNumber); n++) {
        let filePath = '/tmp/o-page'+  n + '.jpg';
        localOutputArray.push(filePath);
       
        let image = await uploadFile(filename_wo_suffix + '-page' + pageNumber + '.jpg', filePath, 'image/jpeg');
        imageArray.push(image);
        pageNumber++;
    }
    let response = makeResponse(200, JSON.stringify({
        newkeys: imageArray
    }));
    await removeLocalFiles(inputPath, localOutputArray);
    return response;
}

exports.handler = async (event) => {
    let eventBody = JSON.parse(event.body);
    let key = eventBody.key;
    console.log(key);
    let qValue = parseInt(eventBody.quality, 10);
    let startPage = (eventBody.startPage != '') ? parseInt(eventBody.startPage, 10) : 0;
    let endPage = (eventBody.endPage != '') ? parseInt(eventBody.endPage, 10) : 0;
    let range = {
        startPage: startPage,
        endPage: endPage
    }
    return await main(key, range, qValue);
};
