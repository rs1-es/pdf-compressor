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

let convertToPdf = async (filesArray, outputPath) => {
    return new Promise((resolve, reject) => {
        let command = 'convert -density 300';
        
        for (let file of filesArray) {
            command += ' "' + file + '"';
        }

        command += ' "' + outputPath + '"';
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

let compressFile = async (inputPath, outputPath, qValue) => {
  return new Promise((resolve, reject) => {
      let command = 'gs -dNOPAUSE -dQUIET -dBATCH' + 
      ' -sDEVICE=pdfwrite' + 
      ' -dPDFSETTINGS=/printer' + 
      ' -dAutoFilterColorImages=false' + 
      ' -dAutoFilterGrayImages=false' + 
      ' -dDownsampleColorImages=true' + 
      ' -dDownsampleGrayImages=true' + 
      ' -dDownsampleMonoImages=true' + 
      ' -dColorImageResolution=' + qValue + 
      ' -dGrayImageResolution=' + qValue + 
      ' -dMonoImageResolution=' + qValue + 
      ' -dPrinted=false' + 
      ' -sOutputFile="' + outputPath +  
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

let removeLocalFiles = async (inputArray, outputPath, tempPath) => {
    return new Promise((resolve, reject) => {
        let exec = require('child_process').exec, child;
        let command = 'rm "' + outputPath + '" "' + tempPath + '"';
        for (let inputPath of inputArray) {
            command += ' "' + inputPath + '"';
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

let main = async (keys, outputPath, qValue) => {
    let tempFiles = [];
    let outputFilename;
    for (let key of keys) {
        console.log(key);
        let key_split = key.split('/');
        let filename = key_split[key_split.length - 1];
        inputPath = '/tmp/' + filename;
        let dotSplit = filename.split('.');
        outputFilename = dotSplit[0] + '.pdf';
        tempFiles.push(inputPath);
        let fileContent = await getFile(key);
        await downloadToTemp(inputPath, fileContent);
    }
    await convertToPdf(tempFiles, '/tmp/temp-out.pdf');
    await compressFile('/tmp/temp-out.pdf', outputPath, qValue);
    let response = await uploadFile(outputFilename, outputPath, 'application/pdf');
    await removeLocalFiles(tempFiles, outputPath, '/tmp/temp-out.pdf');
    return response;
}

exports.handler = async (event) => {
    let event_body = JSON.parse(event.body);
    let keys = event_body.keys;
    let qValue = parseInt(event_body.quality, 10);
    let outputPath = '/tmp/out.pdf';
    return await main(keys, outputPath, qValue);
    
}
