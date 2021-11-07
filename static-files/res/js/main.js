const API_URL = 'https://ffffffffff.execute-api.eu-west-1.amazonaws.com/';

let eventAdded = false;

let content = document.querySelector('.content');

let selectFileBtn = document.getElementById('select-file-btn');

let resetBtn = document.getElementById('reset-btn');

let compressBox = document.getElementById('compress');
let compressName = document.getElementById('compress-name');
let compressContent = compressBox.querySelector('.step-action-content');
let mergeBox = document.getElementById('merge');
let mergeName = document.getElementById('merge-name');
let extractBox = document.getElementById('extract');
let extractName = document.getElementById('extract-name');
let extractContent = extractBox.querySelector('.step-action-content');
let convertToImageBox = document.getElementById('converttoimage');
let convertToImageName = document.getElementById('converttoimage-name');
let convertToImageContent = convertToImageBox.querySelector('.step-action-content');
let fileToPdfBox = document.getElementById('filetopdf');
let fileToPdfName = document.getElementById('filetopdf-name');
let fileToPdfContent = fileToPdfBox.querySelector('.step-action-content');

let filestype;



let applyChangesBtn = document.getElementById('apply-btn');

let responseBg = document.createElement('div');
responseBg.classList.add('response-bg');

let responseWindow = document.createElement('div');
responseWindow.classList.add('response-window');

let responseWindowTextBox = document.createElement('div');

let responseWindowButtonBox = document.createElement('div');
responseWindowButtonBox.classList.add('response-window-button');

responseWindow.appendChild(responseWindowTextBox);

responseBg.appendChild(responseWindow);
content.appendChild(responseBg);

//RESPONSE-WINDOWS 
let RWLoad = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'one');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let loadBar = document.createElement('div');
    loadBar.classList.add('rw-loadbar');

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(loadBar);

    responseBg.style.display = 'grid';
}

let RWComplete = (obj) => {
    responseWindowTextBox.innerHTML = '';

    let header = document.createElement('div');
    header.classList.add('rw-header', 'two');

    let headerText = document.createElement('div');
    headerText.classList.add('rw-header-text');

    let headerTextMain = document.createElement('p');
    headerTextMain.classList.add('rw-header-text-main');
    headerTextMain.innerText = obj.headerMain;

    let headerTextSub = document.createElement('p');
    headerTextSub.classList.add('rw-header-text-sub');
    headerTextSub.innerText = obj.headerSub;

    let headerCloseBtnDiv = document.createElement('div');
    headerCloseBtnDiv.classList.add('rw-header-close');

    headerCloseBtnDiv.innerHTML = '&times;';
    headerCloseBtnDiv.addEventListener('click', () => {
        responseWindowTextBox.innerHTML = '';
        responseBg.style.display = 'none';
    });

    headerText.appendChild(headerTextMain);
    headerText.appendChild(headerTextSub);
    header.appendChild(headerText);
    header.appendChild(headerCloseBtnDiv);

    let main = document.createElement('div');
    main.classList.add('rw-main');

    for (let item of obj.mainContent) {
        if (item.list) {
            let mainList = document.createElement('div');
            mainList.classList.add('rw-main-list');

            let mainListUl = document.createElement('ul');

            for (let prop in item.list) {
                let mainListLi = document.createElement('li');
                mainListLi.innerHTML = prop + ': ' +
                    '<b>' + item.list[prop] + '</b>';
                mainListUl.appendChild(mainListLi);
            }

            mainList.appendChild(mainListUl);
            main.appendChild(mainList);
        } else if (item.link) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');

            let mainTextA = document.createElement('a');
            mainTextA.setAttribute('target', '_blank');
            mainTextA.setAttribute('href', item.link.url);
            mainTextA.innerText = item.link.text;

            mainText.appendChild(mainTextA);
            main.appendChild(mainText);
        } else if (item.textHtml) {
            let mainText = document.createElement('div');
            mainText.classList.add('rw-main-text');

            let mainTextP = document.createElement('p');
            mainTextP.innerHTML = item.textHtml.content;

            mainText.appendChild(mainTextP);
            main.appendChild(mainText);
        } else if (item.html) {
            let mainHtml = document.createElement('div');
            mainHtml.classList.add('rw-main-html');
            mainHtml.innerHTML = item.html.content;

            main.appendChild(mainHtml);
        }
    }

    if (obj.buttonContent) {
        let mainBtns = document.createElement('div');
        mainBtns.classList.add('rw-main-btns');

        let mainBtnsPKBtn = document.createElement('a');
        mainBtnsPKBtn.setAttribute('href', obj.buttonContent.url);
        mainBtnsPKBtn.innerText = obj.buttonContent.text;

        mainBtns.appendChild(mainBtnsPKBtn);

        main.appendChild(mainBtns);
    }

    responseWindowTextBox.appendChild(header);

    responseWindowTextBox.appendChild(main);

    responseBg.style.display = 'grid';
}

let uploadFiles = async (params) => {
    let paths = [];
    for (let file of params.inputData.files) {
        filestype = file.type;
        
        await fetch(API_URL + 'uploadfile', {
            method: 'POST',
            body: JSON.stringify({
                filename: file.name,
                filetype: file.type,
                filesize: file.size
            })
        }).then(async (res) => {
            if (res.ok) {
                await res.json().then(async (data) => {
                    let form = new FormData();
                    Object.keys(data.fields).forEach(key => {
                        form.append(key, data.fields[key]);
                    });
                    form.append('file', file);
                    await fetch(data.url, {
                        method: 'POST',
                        body: form
                    }).then((resUpload) => {
                        if (resUpload.ok) {
                            paths.push(data.fields.key);
                            document.querySelector('.filename').innerHTML += '<p>' + file.name + ' selected</p>';
                        }
                    })
                })
            } else {
                res.json().then((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                    selectFileBtn.innerText = 'Select files';
                })
            }
        });
    }
    
    if (filestype.indexOf('image') == -1) {
        document.getElementById('checkmerge').setAttribute('disabled', 'true');
        document.querySelector('.checkMergeBox label').classList.add('text-disabled');
    } else {
        document.getElementById('checkmerge').removeAttribute('disabled');
        document.querySelector('.checkMergeBox label').classList.remove('text-disabled');
    }


    return paths;
}

let changeBtns = () => {
    selectFileBtn.innerText = 'Files uploaded';
    selectFileBtn.classList.remove('enabled');
    selectFileBtn.classList.add('disabled');
    selectFileBtn.setAttribute('disabled', true);
    resetBtn.classList.remove('disabled');
    resetBtn.classList.add('enabled');
    resetBtn.removeAttribute('disabled');

    applyChangesBtn.removeAttribute('disabled');
    applyChangesBtn.classList.remove('disabled');
    applyChangesBtn.classList.add('enabled');
}

let pathArray;
let selectInput = document.createElement('input');
selectInput.setAttribute('type', 'file');
selectInput.setAttribute('accept', 'application/pdf,image/*,.doc,.docx,application/vnd.oasis.opendocument.text,text/plain');
selectInput.setAttribute('multiple', 'true');

selectFileBtn.addEventListener('click', () => {
    selectInput.click();
    if (!eventAdded) {
        eventAdded = true;
        selectInput.addEventListener('change', async () => {
            selectFileBtn.innerText = 'Uploading...';
            pathArray = await uploadFiles({
                inputData: selectInput
            });
            if (pathArray.length > 0) {
                changeBtns();
            }

            console.log(pathArray);
        })
    }
});

let dropFileBox = document.getElementById('dropFileHere');
dropFileBox.addEventListener('drop', async (e) => {
    e.preventDefault();
    console.log('File dropped');
    //console.log(e.dataTransfer);
    selectFileBtn.innerText = 'Uploading...';
    pathArray = await uploadFiles({
        inputData: e.dataTransfer
    });
    if (pathArray.length > 0) {
        changeBtns();
    }

    console.log(pathArray);
});

dropFileBox.addEventListener('dragover', (e) => {
    e.preventDefault();
});

resetBtn.addEventListener('click', () => {
    selectFileBtn.innerText = 'Select files';
    selectFileBtn.classList.remove('disabled');
    selectFileBtn.classList.add('enabled');
    selectFileBtn.removeAttribute('disabled');
    resetBtn.classList.remove('enabled');
    resetBtn.classList.add('disabled');
    resetBtn.setAttribute('disabled', true);
    applyChangesBtn.setAttribute('disabled', true);

    applyChangesBtn.setAttribute('disabled', true);
    applyChangesBtn.classList.remove('enabled');
    applyChangesBtn.classList.add('disabled');

    document.querySelector('.filename').innerHTML = '';

    pathArray = [];
})

compressName.addEventListener('click', () => {
    if (compressBox.classList.contains('action-disabled')) {
        compressBox.classList.remove('action-disabled');
        compressBox.classList.add('action-enabled');
        compressContent.classList.remove('action-content-disabled');
        compressContent.classList.add('action-content-enabled');

        mergeBox.classList.remove('action-enabled');
        mergeBox.classList.add('action-disabled');

        extractBox.classList.remove('action-enabled');
        extractBox.classList.add('action-disabled');
        extractContent.classList.remove('action-content-enabled');
        extractContent.classList.add('action-content-disabled');

        convertToImageBox.classList.remove('action-enabled');
        convertToImageBox.classList.add('action-disabled');
        convertToImageContent.classList.remove('action-content-enabled');
        convertToImageContent.classList.add('action-content-disabled');

        fileToPdfBox.classList.remove('action-enabled');
        fileToPdfBox.classList.add('action-disabled');
        fileToPdfContent.classList.remove('action-content-enabled');
        fileToPdfContent.classList.add('action-content-disabled');
    } else {
        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');
    }
});

mergeName.addEventListener('click', () => {
    if (mergeBox.classList.contains('action-disabled')) {
        mergeBox.classList.remove('action-disabled');
        mergeBox.classList.add('action-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');

        extractBox.classList.remove('action-enabled');
        extractBox.classList.add('action-disabled');
        extractContent.classList.remove('action-content-enabled');
        extractContent.classList.add('action-content-disabled');

        convertToImageBox.classList.remove('action-enabled');
        convertToImageBox.classList.add('action-disabled');
        convertToImageContent.classList.remove('action-content-enabled');
        convertToImageContent.classList.add('action-content-disabled');

        fileToPdfBox.classList.remove('action-enabled');
        fileToPdfBox.classList.add('action-disabled');
        fileToPdfContent.classList.remove('action-content-enabled');
        fileToPdfContent.classList.add('action-content-disabled');
    } else {
        mergeBox.classList.remove('action-enabled');
        mergeBox.classList.add('action-disabled');
    }
});

extractName.addEventListener('click', () => {
    if (extractBox.classList.contains('action-disabled')) {
        extractBox.classList.remove('action-disabled');
        extractBox.classList.add('action-enabled');
        extractContent.classList.remove('action-content-disabled');
        extractContent.classList.add('action-content-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');

        mergeBox.classList.remove('action-enabled');
        mergeBox.classList.add('action-disabled');

        convertToImageBox.classList.remove('action-enabled');
        convertToImageBox.classList.add('action-disabled');
        convertToImageContent.classList.remove('action-content-enabled');
        convertToImageContent.classList.add('action-content-disabled');

        fileToPdfBox.classList.remove('action-enabled');
        fileToPdfBox.classList.add('action-disabled');
        fileToPdfContent.classList.remove('action-content-enabled');
        fileToPdfContent.classList.add('action-content-disabled');
    } else {
        extractBox.classList.remove('action-enabled');
        extractBox.classList.add('action-disabled');
        extractContent.classList.remove('action-content-enabled');
        extractContent.classList.add('action-content-disabled');
    }
});

convertToImageName.addEventListener('click', () => {
    if (convertToImageBox.classList.contains('action-disabled')) {
        convertToImageBox.classList.remove('action-disabled');
        convertToImageBox.classList.add('action-enabled');
        convertToImageContent.classList.remove('action-content-disabled');
        convertToImageContent.classList.add('action-content-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');

        extractBox.classList.remove('action-enabled');
        extractBox.classList.add('action-disabled');
        extractContent.classList.remove('action-content-enabled');
        extractContent.classList.add('action-content-disabled');

        fileToPdfBox.classList.remove('action-enabled');
        fileToPdfBox.classList.add('action-disabled');
        fileToPdfContent.classList.remove('action-content-enabled');
        fileToPdfContent.classList.add('action-content-disabled');
    } else {
        convertToImageBox.classList.remove('action-enabled');
        convertToImageBox.classList.add('action-disabled');
        convertToImageContent.classList.remove('action-content-enabled');
        convertToImageContent.classList.add('action-content-disabled');
    }
});

fileToPdfName.addEventListener('click', () => {
    if (fileToPdfBox.classList.contains('action-disabled')) {
        fileToPdfBox.classList.remove('action-disabled');
        fileToPdfBox.classList.add('action-enabled');
        fileToPdfContent.classList.remove('action-content-disabled');
        fileToPdfContent.classList.add('action-content-enabled');

        compressBox.classList.remove('action-enabled');
        compressBox.classList.add('action-disabled');
        compressContent.classList.remove('action-content-enabled')
        compressContent.classList.add('action-content-disabled');

        mergeBox.classList.remove('action-enabled');
        mergeBox.classList.add('action-disabled');

        extractBox.classList.remove('action-enabled');
        extractBox.classList.add('action-disabled');
        extractContent.classList.remove('action-content-enabled');
        extractContent.classList.add('action-content-disabled');

        convertToImageBox.classList.remove('action-enabled');
        convertToImageBox.classList.add('action-disabled');
        convertToImageContent.classList.remove('action-content-enabled');
        convertToImageContent.classList.add('action-content-disabled');
    } else {
        fileToPdfBox.classList.remove('action-enabled');
        fileToPdfBox.classList.add('action-disabled');
        fileToPdfContent.classList.remove('action-content-enabled');
        fileToPdfContent.classList.add('action-content-disabled');
    }
});

let applyChanges = async () => {
    AWS.config.region = 'eu-west-1';
    AWS.config.credentials = new AWS.Credentials({
        accessKeyId: '',
        secretAccessKey: ''
    });
    AWS.config.update({
        maxRetries: 0,
        httpOptions: {
            timeout: 300000,
            connectTimeout: 5000
        }
    });
    let lambda = new AWS.Lambda();

    if (compressBox.classList.contains('action-enabled')) {
        let qValue = document.getElementById('quality-input').value;
        let newPaths = [];
        for (let path of pathArray) {
            await lambda.invoke({
                FunctionName: 'pdf-compressor-prod-compressfile',
                Payload: JSON.stringify({
                    body: JSON.stringify({
                        key: path,
                        quality: qValue
                    })
                })
            })
                .promise()
                .then((response) => {
                    let payload = JSON.parse(response.Payload);
                    let payloadBody = JSON.parse(payload.body);
                    let newpath = payloadBody.newkey;
                    newPaths.push(newpath);
                    //console.log(response);

                }).catch((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                });
        }
        let RWParams = {
            headerMain: 'Processing completed',
            headerSub: 'Links to the compressed PDFs:',
            mainContent: []
        }
        for (let newPath of newPaths) {
            RWParams.mainContent.push({
                link: {
                    url: 'https://pdfcompressor.rs1.es/' + encodeURI(newPath),
                    text: 'https://pdfcompressor.rs1.es/' + newPath
                }
            })
        }
        RWComplete(RWParams);
    }

    if (mergeBox.classList.contains('action-enabled')) {
        let newPaths = [];

        await lambda.invoke({
            FunctionName: 'pdf-compressor-prod-mergefiles',
            Payload: JSON.stringify({
                body: JSON.stringify({
                    keys: pathArray
                })
            })
        }).promise()
            .then((response) => {
                let payload = JSON.parse(response.Payload);
                let payloadBody = JSON.parse(payload.body);
                let newpath = payloadBody.newkey;
                newPaths.push(newpath);
            }).catch((err) => {
                RWComplete({
                    headerMain: 'ERROR',
                    headerSub: 'There is an error with the request',
                    mainContent: [
                        {
                            list: err
                        }
                    ]
                });
            });

        let RWParams = {
            headerMain: 'Processing completed',
            headerSub: 'Links to the compressed PDFs:',
            mainContent: []
        }
        for (let newPath of newPaths) {
            RWParams.mainContent.push({
                link: {
                    url: 'https://pdfcompressor.rs1.es/' + encodeURI(newPath),
                    text: 'https://pdfcompressor.rs1.es/' + newPath
                }
            })
        }

        RWComplete(RWParams);
    }

    if (extractBox.classList.contains('action-enabled')) {
        let startPage = document.getElementById('start-input').value;
        let endPage = document.getElementById('end-input').value;
        if (startPage != '' && startPage != '') {
            let newPaths = [];
            for (let path of pathArray) {
                await lambda.invoke({
                    FunctionName: 'pdf-compressor-prod-extractpages',
                    Payload: JSON.stringify({
                        body: JSON.stringify({
                            key: path,
                            startPage: startPage,
                            endPage: endPage
                        })
                    })
                })
                    .promise()
                    .then((response) => {
                        let payload = JSON.parse(response.Payload);
                        let payloadBody = JSON.parse(payload.body);
                        let newpath = payloadBody.newkey;
                        newPaths.push(newpath);
                        //console.log(response);



                    }).catch((err) => {
                        RWComplete({
                            headerMain: 'ERROR',
                            headerSub: 'There is an error with the request',
                            mainContent: [
                                {
                                    list: err
                                }
                            ]
                        });
                    });
            }
            let RWParams = {
                headerMain: 'Processing completed',
                headerSub: 'Links to the compressed PDFs:',
                mainContent: []
            }
            for (let newPath of newPaths) {
                RWParams.mainContent.push({
                    link: {
                        url: 'https://pdfcompressor.rs1.es/' + encodeURI(newPath),
                        text: 'https://pdfcompressor.rs1.es/' + newPath
                    }
                })
            }
            RWComplete(RWParams);
        }

    }

    if (convertToImageBox.classList.contains('action-enabled')) {
        let newPaths = [];
        let startPage = document.getElementById('start-input-image').value;
        let endPage = document.getElementById('end-input-image').value;
        let qValue = document.getElementById('quality-input-image').value;
        for (let path of pathArray) {
            await lambda.invoke({
                FunctionName: 'pdf-compressor-prod-converttoimage',
                Payload: JSON.stringify({
                    body: JSON.stringify({
                        key: path,
                        startPage: startPage,
                        endPage: endPage,
                        quality: qValue
                    })
                })
            }).promise()
                .then((response) => {
                    let payload = JSON.parse(response.Payload);
                    let payloadBody = JSON.parse(payload.body);
                    for (let newKey of payloadBody.newkeys) {
                        newPaths.push(newKey);
                    }
                }).catch((err) => {
                    RWComplete({
                        headerMain: 'ERROR',
                        headerSub: 'There is an error with the request',
                        mainContent: [
                            {
                                list: err
                            }
                        ]
                    });
                });
        }



        let RWParams = {
            headerMain: 'Processing completed',
            headerSub: 'Links to the compressed PDFs:',
            mainContent: []
        }
        for (let newPath of newPaths) {
            RWParams.mainContent.push({
                link: {
                    url: 'https://pdfcompressor.rs1.es/' + encodeURI(newPath),
                    text: 'https://pdfcompressor.rs1.es/' + newPath
                }
            })
        }

        RWComplete(RWParams);
    }

    if (fileToPdfBox.classList.contains('action-enabled')) {
        let newPaths = [];
        let qValue = document.getElementById('quality-input-filetopdf').value;

        let functionName; //pdf-compressor-imagetopdf
        let merge = document.getElementById('checkmerge').checked;

        if (filestype.indexOf('image') != -1) {
            console.log('Es imagen');
            functionName = 'pdf-compressor-prod-imagetopdf';
            if (!merge) {
                console.log('Procesar por separado');
                for (let path of pathArray) {
                    await lambda.invoke({
                        FunctionName: functionName,
                        Payload: JSON.stringify({
                            body: JSON.stringify({
                                keys: [path],
                                quality: qValue
                            })
                        })
                    }).promise()
                        .then((response) => {
                            let payload = JSON.parse(response.Payload);
                            let payloadBody = JSON.parse(payload.body);
                            let newpath = payloadBody.newkey;
                            newPaths.push(newpath);
                        }).catch((err) => {
                            RWComplete({
                                headerMain: 'ERROR',
                                headerSub: 'There is an error with the request',
                                mainContent: [
                                    {
                                        list: err
                                    }
                                ]
                            });
                        });
                }
            } else {
                console.log('Procesar junto');
                await lambda.invoke({
                    FunctionName: functionName,
                    Payload: JSON.stringify({
                        body: JSON.stringify({
                            keys: pathArray,
                            quality: qValue
                        })
                    })
                }).promise()
                    .then((response) => {
                        let payload = JSON.parse(response.Payload);
                        let payloadBody = JSON.parse(payload.body);
                        let newpath = payloadBody.newkey;
                        newPaths.push(newpath);
                    }).catch((err) => {
                        RWComplete({
                            headerMain: 'ERROR',
                            headerSub: 'There is an error with the request',
                            mainContent: [
                                {
                                    list: err
                                }
                            ]
                        });
                    });
            }
        } else if (filestype == 'application/vnd.oasis.opendocument.text' || 
            filestype == 'text/plain' || 
            filestype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            filestype == 'application/msword') {
            console.log('Es documento office');
            functionName = 'pdf-compressor-prod-documenttopdf';
            for (let path of pathArray) {
                await lambda.invoke({
                    FunctionName: functionName,
                    Payload: JSON.stringify({
                        body: JSON.stringify({
                            keys: [path],
                            quality: qValue
                        })
                    })
                }).promise()
                    .then((response) => {
                        let payload = JSON.parse(response.Payload);
                        let payloadBody = JSON.parse(payload.body);
                        let newpath = payloadBody.newkey;
                        newPaths.push(newpath);
                    }).catch((err) => {
                        RWComplete({
                            headerMain: 'ERROR',
                            headerSub: 'There is an error with the request',
                            mainContent: [
                                {
                                    list: err
                                }
                            ]
                        });
                    });
            }
        }




        let RWParams = {
            headerMain: 'Processing completed',
            headerSub: 'Links to the compressed PDFs:',
            mainContent: []
        }
        for (let newPath of newPaths) {
            RWParams.mainContent.push({
                link: {
                    url: 'https://pdfcompressor.rs1.es/' + encodeURI(newPath),
                    text: 'https://pdfcompressor.rs1.es/' + newPath
                }
            })
        }

        RWComplete(RWParams);
    }

}

applyChangesBtn.addEventListener('click', async () => {
    RWLoad({
        headerMain: 'Processing the file, please wait...',
        headerSub: ''
    })

    await applyChanges();
});
