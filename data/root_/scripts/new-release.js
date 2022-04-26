function checkPhoto(target) {
    document.getElementById("photoLabel").innerHTML = "";
    var _URL = window.URL || window.webkitURL;
    var file = target.files[0];
    var img = new Image();
    var objectUrl = _URL.createObjectURL(file);
    img.onload = function () {
        if (this.width > 1280 || this.height > 1280){
            var onSuccessResize = (image)=>{
                let container = new DataTransfer(); 
                container.items.add(image);
                target.files = container.files;
                notice.Success(LANG.file_resized)
                checkPhoto(target)
            }
            if (JSON.parse(local_storage["resize-images"])){
                document.getElementById("photoLabel").innerHTML = LANG.start_resize
                ResizeRequest(file, onSuccessResize, ...resizeWithRatio(this.width, this.height, 1280, 1280)); return
            }
            else{
                document.getElementById("photoLabel").innerHTML += `${LANG.max_res} <i style='color:red'>1280x1280</i>! <br>`;
                target.value = '';
            }
        }
        _URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    if(file.size > 2097152) {
        document.getElementById("photoLabel").innerHTML += `${LANG.max_img_s} <i style='color:red'>2Mb</i>! <br>`;
        target.value = '';
    }

    if (file && file['type'].split('/')[0] != 'image'){
        document.getElementById("photoLabel").innerHTML += `${LANG.wrong_file_format} <br>`;
        target.value = '';
    }
}

function checkAudio(target) {
    document.getElementById("audioLabel").innerHTML = "";
    var _URL = window.URL || window.webkitURL;
    var file = target.files[0];
    var audio = new Audio();
    var objectUrl = _URL.createObjectURL(file);
    var all_bitrates = [128, 192, 320]
    audio.addEventListener("loadedmetadata", function(){
        var kbit=file.size/128;
        var kbps= Math.ceil(Math.round(kbit/audio.duration)/16)*16;

        var differences = all_bitrates.map(e=>Math.abs(e-kbps));
        let min_index = differences.indexOf(Math.min(...differences));
        var bitrate_average = all_bitrates[min_index];

        if (bitrate_average > 192){
            document.getElementById("audioLabel").innerHTML += `${LANG.max_bitrate} <i style='color:red'>192kbps</i>! <br>`;
            target.value = '';
        }
        _URL.revokeObjectURL(objectUrl);
    })
    audio.src = objectUrl;

    if(file.size > 10485760) {
        document.getElementById("audioLabel").innerHTML += `${LANG.max_audio_s} <i style='color:red'>10Mb</i>! <br>`;
        target.value = '';
    }

    if (file && file['type'].split('/')[0] != 'audio'){
        document.getElementById("audioLabel").innerHTML += `${LANG.wrong_file_format} <br>`;
        target.value = '';
    }
    if (file && file.name.split('.').at(-1) != 'mp3'){
        document.getElementById("audioLabel").innerHTML += `${LANG.wrong_file_format} <br>`;
        target.value = '';
    }
}


function ResizeRequest(file, callback, desired_W=1280, desired_H=1280){
    if (file.type.split('/')[0] != 'image'){
        console.error('File to resize is not image.')
    }
    var new_name = file.name.split('.').slice(0, -1).join() + ".jpg"
    var onSuccess = function (newImage){
        fetch(newImage)
        .then(res => res.blob())
        .then(resizedImage => {
            var file = new File([resizedImage], new_name, {type: 'image/jpeg'});
            callback(file)
        })
    };
    var onError = (e)=>{ console.error(e) }

    var reader = new FileReader();
    reader.onload = function (readerEvent) {
        let image_src = readerEvent.target.result;
        resizeImage(image_src, desired_W, desired_H, 0.9, onSuccess, onError)
    }
    reader.readAsDataURL(file);
}

function resizeImage(imageUrl, newWidth, newHeight, quality, onReady, onError) {
    var image = document.createElement('img');
    image.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        var context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, newWidth, newHeight);
        try {
            // quality (from 0 to 1.0)
            var dataUrl = canvas.toDataURL('image/jpeg', quality);
            onReady(dataUrl);
        } catch (e) {
            if (onError) {
                onError('Image saving error.');
            }
        }
    };
    image.onerror = function() {
        if (onError) {
            onError('Image loading error.');
        }
    };
    image.src = imageUrl;
};
function resizeWithRatio(width, height, max_W, max_H){
    if (width > height) {
        if (width > max_W) {
            height *= max_W / width;
            width = max_W;
        }
    } else {
        if (height > max_H) {
            width *= max_H / height;
            height = max_H;
        }
    }
    return [parseInt(width), parseInt(height)];
}


function openLink(target){
    var link = target.parentElement.querySelector("input").value;
    if (link){
        window.open(link, '_blank');
    }
}

var hosts = {
    'spotify': ["https://open.spotify.com"],
    'youtube_music': ["https://music.youtube.com"],
    'youtube': ["https://youtu.be", "https://www.youtube.com"],
    'apple_music': ["https://music.apple.com"],
    'deezer': ["https://deezer.page.link"],
    'soundcloud': ["https://soundcloud.com"],
    'newgrounds': ["https://www.newgrounds.com"]
}
async function checkLink(target){
    if (target.value){
        try{
            const domain = (new URL(target.value)).origin;
            if (hosts[  target.id.split("form_")[1]  ].includes(domain)){
                target.style.border = "3px solid lightgreen";
                target.style.boxShadow = "0 0 10px lightgreen";
            }
            else{
                target.style.border = "3px solid red";
                target.style.boxShadow = "0 0 10px red";
            }
        }
        catch{
            target.style.border = "3px solid red";
            target.style.boxShadow = "0 0 10px red";
        }
    }
    else{
        target.style.border = "";
        target.style.boxShadow = "";
    }
}

function get_decode_error(code){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", '../api/decode_error', false)
    xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhr.send(JSON.stringify({'code': code, 'lang': language}))
    if (xhr.status != 200){ return code }
    else{
        let answer = JSON.parse(xhr.response)
        if (!answer.successfully){ return code }
        else{ return answer.value }         
    }
}

function sendForm(form){
    document.getElementById('loading_waveform').parentNode.style.display = "table-cell";

    var arr = form.querySelectorAll("input");
    var formData = new FormData();

    var final = {};
    arr.forEach(function(e){
        if (e.id && e.value){
            if (e.files){
                formData.append(e.id.split("form_")[1], e.files.item(0));
                Object.assign(final, {
                    [e.id.split("form_")[1]] : e.files.item(0).name
                });
            }
            else if (e.type == "checkbox"){
                formData.append(e.id.split("form_")[1], e.checked)
                Object.assign(final, {
                    [e.id.split("form_")[1]] : e.checked
                });
            }
            else{
                formData.append(e.id.split("form_")[1], e.value.trim())
                Object.assign(final, {
                    [e.id.split("form_")[1]] : e.value.trim()
                });
            }
        }
    });

    formData.append('password', local_storage.userPassword)

    let req = new XMLHttpRequest();                          
    req.open("POST", '../api/uploader');
    req.onload = function() {
        if (req.status != 200){notice.Error(LANG.error)}
        else{
            answer = JSON.parse(req.response)
            if (!answer.successfully){
                if (answer.reason == "incorrect_name_or_password"){
                    notice.clearAll()
                    notice.Error(get_decode_error(answer.reason), false, [[LANG.log_out, logout]])
                }
                else{
                    notice.Error(get_decode_error(answer.reason))
                }
            }
            else{
                notice.clearAll()
                notice.Success(LANG.files_uploaded, false, [[LANG.go_to, _=>{
                    window.location.href = "../" + answer.url
                }]])
            }
        }
        document.getElementById('loading_waveform').parentNode.style.display = "none"
    }
    req.onerror = _=> notice.Error(LANG.error);
    req.send(formData);
}

function logout(){
    window.localStorage.removeItem("userName")
    window.localStorage.removeItem("userPassword")
    goToLogin()
}

window.onload = function(){
    (function load_page(){
        if (typeof header !== 'undefined' && typeof body !== 'undefined'){
            document.title = `${LANG.new_release} - Zombi Music`
            document.body.innerHTML += header
            document.body.innerHTML += body
            main()
        }
        else{
            setTimeout(function(){load_page()}, 100)
        }
    })()
}

function goToLogin(){
    let url = window.location.pathname;
    let filename = url.substring(url.lastIndexOf('/')+1);

    let login = new URL("login", window.location.href);
    login.searchParams.append('redirect', filename);

    window.location.href = login.href
}

function try_dark(e){
    if (darkThemeMq){
        e.src = e.src.split('.').slice(0, -1).join('.') + "_dark.svg"
    }
    else{
        e.src = e.src.split('.').slice(0, -1).join('.').split("_dark")[0] + ".svg"
    }
}

function main(){
    notice = Notification('#notifications');
    local_storage = { ...localStorage };
    if (local_storage.userName && local_storage.userPassword){
        document.getElementById("form_artist").value = local_storage.userName
    }
    else{
        goToLogin()
    }
    
    document.querySelector(".logout > svg").onclick = logout

    if (document.getElementById('myAccount').getElementsByTagName('img')[0].src.split('.').pop() == "svg"){
        try_dark(document.getElementById('myAccount').getElementsByTagName('img')[0])
    }

    editInit()
}

function editInit(){
    const urlSearchParams = new URLSearchParams(window.location.search);
    searchParams = Object.fromEntries(urlSearchParams.entries());
    if (searchParams.edit){
        document.getElementById("formTitle").innerHTML = LANG.edit_track
        document.title = `${LANG.edit} - ${searchParams.edit}`

        let xhr = new XMLHttpRequest();
        xhr.open("POST", `../api/get_track_info`, false)
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify({
            'artist': local_storage.userName,
            'track': searchParams.edit
        }))
        if (xhr.status != 200){ notice.Error(LANG.error) }
        else{
            let answer = JSON.parse(xhr.response);
            if (!answer.successfully){ notice.Error(get_decode_error(answer.reason)) }
            else {
                document.getElementById("form_track_name").setAttribute('readonly', true);
                document.getElementById("form_track_name").value = answer.config.track_name;
                document.getElementById("form_genre").value = answer.config.genre;
                document.getElementById("form_image").parentNode.parentNode.style.display = "none"
                document.getElementById("form_image").required = false;
                document.getElementById("form_audio").parentNode.parentNode.style.display = "none"
                document.getElementById("form_audio").required = false;
                
                function convertDate(date_str){
                    var tmp = date_str.split(".")
                    var now = new Date(tmp[2], tmp[1]-1, tmp[0])

                    var day = ("0" + now.getDate()).slice(-2);
                    var month = ("0" + (now.getMonth() + 1)).slice(-2);
                    var today = now.getFullYear()+"-"+(month)+"-"+(day);
                    return today;
                }

                document.getElementById("form_release_date").value = convertDate(answer.config.date)
                document.getElementById("form_allow_download").checked = answer.config.allow_download

                if (answer.config.links){
                    Object.keys(answer.config.links).forEach(e=>{
                        document.getElementById("form_" + e).value = answer.config.links[e];
                    })
                }

                document.getElementById("mainForm").onsubmit = ()=> sendEditedForm(document.getElementById("mainForm"));
            }
        }
    }
}

function sendEditedForm(form){
    document.getElementById('loading_waveform').parentNode.style.display = "table-cell";

    var arr = form.querySelectorAll("input");
    var formData = new FormData();

    var final = {};
    arr.forEach(function(e){
        if (e.id && e.value){
            if (e.type == "checkbox"){
                formData.append(e.id.split("form_")[1], e.checked)
                Object.assign(final, {
                    [e.id.split("form_")[1]] : e.checked
                });
            }
            else{
                formData.append(e.id.split("form_")[1], e.value.trim())
                Object.assign(final, {
                    [e.id.split("form_")[1]] : e.value.trim()
                });
            }
        }
    });

    formData.append('password', local_storage.userPassword)

    let req = new XMLHttpRequest();                          
    req.open("POST", '../api/edit_track');
    req.onload = function() {
        if (req.status != 200){notice.Error(LANG.error)}
        else{
            answer = JSON.parse(req.response)
            if (!answer.successfully){
                if (answer.reason == "incorrect_name_or_password"){
                    notice.clearAll()
                    notice.Error(get_decode_error(answer.reason), false, [[LANG.log_out, logout]])
                }
                else{
                    notice.Error(get_decode_error(answer.reason))
                }
            }
            else{
                notice.clearAll()
                notice.Success("OK", false, [[LANG.go_to, _=>{
                    window.location.href = "../" + answer.url
                }]])
            }
        }
        document.getElementById('loading_waveform').parentNode.style.display = "none"
    }
    req.onerror = _=> notice.Error(LANG.error);
    req.send(formData);

    return false;
}
