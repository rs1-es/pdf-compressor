const AWS = require('aws-sdk');
const BUCKETNAME = '';

exports.handler = async (event) => {
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
    
    return new Promise((resolve, reject) => {
        let event_body = JSON.parse(event.body);
        console.log(JSON.stringify(event_body));
        let bucket = BUCKETNAME;
        let folder = parseInt(Math.random() * 100000, 10);
        let key = 'files/input/' + folder.toString()  + '/' + event_body.filename;
        let type = event_body.filetype;
        let size = parseInt(event_body.filesize, 10);
        let params_presign = '';
          
        let s3 = new AWS.S3();
        
        let maxsize = 1024 * 1024 * 400;  //400MB
        
        if(size > maxsize) {
            let body = {
                message: 'File is too big'
            };
            let response = makeResponse(501, JSON.stringify(body));
            console.log(response);
            resolve(response);
        }
        
        if(type != 'application/pdf' && 
            type.indexOf('image') == -1 && 
            type != 'application/vnd.oasis.opendocument.text' && 
            type != 'text/plain' && 
            type != 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && 
            type != 'application/msword'){
            let response = makeResponse(502, JSON.stringify({message: 'File is not admitted'}));
            console.log(response);
            resolve(response);
        } else {
            params_presign = {
                Bucket: bucket,
                Fields: {
                    key: key,
                    'content-type': type
                }
            };
        } 
        s3.createPresignedPost(params_presign, (err_cpp, data_cpp) => {
            if (err_cpp) {
                let response = makeResponse(503, JSON.stringify(err_cpp));
                console.log(response);
                resolve(response);
            } else {
                let response = makeResponse(200, JSON.stringify(data_cpp));
                resolve(response);
            }
        });  
        
    });
};
