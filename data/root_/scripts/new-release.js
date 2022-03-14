function checkPhoto(target) {
    document.getElementById("photoLabel").innerHTML = "";
    var _URL = window.URL || window.webkitURL;
    file = target.files[0];
    img = new Image();
    var objectUrl = _URL.createObjectURL(file);
    img.onload = function () {
        if (this.width > 1080 || this.height > 1080){
            document.getElementById("photoLabel").innerHTML += `${LANG.max_res} <i style='color:red'>1080x1080</i>! <br>`;
            target.value = '';
        }
        _URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    if(target.files[0].size > 1048576) {
        document.getElementById("photoLabel").innerHTML += `${LANG.max_img_s} <i style='color:red'>1Mb</i>! <br>`;
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

function sendForm(form){
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
    req.send(formData);

    req.onload = async function() {
        if (req.status != 200){console.log("Ошибка")}
        else{
            answer = JSON.parse(req.response)
            if (!answer.successfully){console.log("Ошибка!", answer.reason)}
            else{
                console.log("Файлы успешно загружены!")
            }
        }
    }
    req.ontimeout = async function() {console.log("Ошибка")};
    req.onerror = async function() {console.log("Ошибка")};
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

function main(){
    notice = Notification('#notifications');
    local_storage = { ...localStorage };
    if (local_storage.userName && local_storage.userPassword){
        document.getElementById("form_artist").value = local_storage.userName
    }
    else{
        let url = window.location.pathname;
        let filename = url.substring(url.lastIndexOf('/')+1);

        let login = new URL("login", window.location.href);
        login.searchParams.append('redirect', filename);

        window.location.href = login.href
    }
}
