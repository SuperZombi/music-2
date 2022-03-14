function checkPhoto(target) {
    document.getElementById("photoLabel").innerHTML = "";
    var _URL = window.URL || window.webkitURL;
    file = target.files[0];
    img = new Image();
    var objectUrl = _URL.createObjectURL(file);
    img.onload = function () {
        if (this.width > 1280 || this.height > 1280){
            document.getElementById("photoLabel").innerHTML += `${LANG.max_res} <i style='color:red'>1280x1280</i>! <br>`;
            target.value = '';
        }
        _URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    if(target.files[0].size > 2097152) {
        document.getElementById("photoLabel").innerHTML += `${LANG.max_img_s} <i style='color:red'>2Mb</i>! <br>`;
        target.value = '';
    }
}

function checkAudio(target) {
    document.getElementById("audioLabel").innerHTML = "";
    if(target.files[0].size > 10485760) {
        document.getElementById("audioLabel").innerHTML += `${LANG.max_audio_s} <i style='color:red'>10Mb</i>! <br>`;
        target.value = '';
    }
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
    xhr.onerror = _=> notice.Error(LANG.error);
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
}
