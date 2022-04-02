window.onload = function() {
	(function load_page(){
	if (typeof header !== 'undefined' && typeof body !== 'undefined'){
		document.title = `${LANG.profile_title} - Zombi Music`
		document.body.innerHTML += header
		document.body.innerHTML += body

		setTimeout(function(){document.body.style.transition = "1s"}, 500)

		main()
	}
	else{
		setTimeout(function(){load_page()}, 500)
	}
	})()
}
window.onresize = function(){ overflowed() }
window.orientationchange = function(){ overflowed() }
window.onscroll = function(){showScrollTop()}

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

function ckeck_empty(){
	if (document.getElementById("main_page").querySelector(".category_body").innerHTML == ""){
		document.getElementById("empty").style.display = "block"
	}
}

function logout(){
    window.localStorage.removeItem("userName")
    window.localStorage.removeItem("userPassword")
    goToLogin()
}
function goToLogin(){
	let url = window.location.pathname;
	let filename = url.substring(url.lastIndexOf('/')+1);
	if (filename == ""){
		filename = "../" + url.split("/").filter(x => x).at(-1)
	}

	let login = new URL("login", window.location.href);
	login.searchParams.append('redirect', filename);

	window.location.href = decodeURIComponent(login.href)
}

function main(){
	notice = Notification('#notifications');
	document.querySelector("#notifications").classList.add("notifications_top")
	document.querySelector(".logout > svg").onclick = logout

	local_storage = { ...localStorage };
	if (local_storage.userName && local_storage.userPassword){
		document.getElementById("user-name").innerHTML = local_storage.userName
		submain()
	}
	else{
		goToLogin()
	}

	if (document.getElementById('artist_image').src.split('.').pop() == "svg"){
		try_dark(document.getElementById('artist_image'))
	}
	var tmp_ = document.getElementById("empty")
	if (tmp_){
		tmp_2 = tmp_.getElementsByTagName("img")
		Object.keys(tmp_2).forEach(function(e){
			try_dark(tmp_2[e])
		})
	}
}

var global_tracks;
async function submain() {
	let xhr = new XMLHttpRequest();
	xhr.open("POST", '../api/get_tracks', false)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.send(JSON.stringify({'user': local_storage.userName}))
	if (xhr.status != 200){ notice.Error(LANG.error) }
	else{
		let answer = JSON.parse(xhr.response);
		if (!answer.successfully){ notice.Error(LANG.error) }
		else {
			global_tracks = answer.tracks
			await addNewCategory(sortByDate(getAllAuthorTracks(answer.tracks)))
			overflowed()
			ckeck_empty()
		}
	}
}


function showScrollTop(){
	if (window.scrollY > 200){
		document.getElementById("toTop").style.bottom = "10px"
	}
	else{
		document.getElementById("toTop").style.bottom = "-50%"
	}
}
function overflowed() {
	var arr = document.getElementsByClassName('track_name')
	Object.keys(arr).forEach(function(e){
		if (arr[e].scrollWidth>arr[e].offsetWidth){
			arr[e].getElementsByTagName('span')[0].className = "marquee"
		}
		else{
			if (arr[e].getElementsByTagName('span')[0].className){
				arr[e].getElementsByTagName('span')[0].className = ""
			}
		}
	})
}
async function addNewCategory(tracks){
	await new Promise((resolve, reject) => {
		var div = document.createElement('div')
		div.className = "category flexable"

		var subdiv = document.createElement('div')
		subdiv.className = "category_body"
		subdiv.style = "justify-content: space-evenly;"

		tracks.forEach(function(e){
			var a = document.createElement('a');
			a.className = "about_box";
			a.onclick = ()=>show(e.track, a)
			a.innerHTML = `
					<img src="../${e.href}/${e.image}">
					<div class="track_name"><span>${e.track}</span></div>
			`
			subdiv.appendChild(a)
		})
		div.appendChild(subdiv)
		document.getElementById("main_page").appendChild(div)
		resolve()
	});
}

function getAllAuthorTracks(bd){
	var tracks = bd.tracks
	var tracks_obj = []
	Object.keys(tracks).forEach(function(e){
		var _temp = Object.assign({"track":e, "href":`${bd.path}/${tracks[e].path}`}, tracks[e])
		tracks_obj.push(_temp)
	})
	return tracks_obj
}

function sortByDate(what){
	what.forEach(function(e){
		var tmp = e.date.split(".")
		var x = new Date(tmp[2], tmp[1]-1, tmp[0])
		e.date = x
	})
	return what.sort((a, b) => b.date - a.date)
}


current_show = ""
current_show_obj = ""
var timout_menu;
function show(what, obj){
	if (timout_menu) {
		clearTimeout(timout_menu);
	}
	current_show = what
	current_show_obj = obj
	document.getElementById("card_previewer_name_txt").innerHTML = what;
	pr = document.getElementById("card_previewer").style
	pr.display = "flex"
	pr_name = document.getElementById("card_previewer_name")
	pr_name.style.display = "block"
	timout_menu = setTimeout(function(){
		pr.transform = "translateY(0)"
		pr_name.style.transform = "translateY(0)"
	}, 0)
}
function hide(){
	if (timout_menu) {
		clearTimeout(timout_menu);
	}
	pr = document.getElementById("card_previewer").style
	pr_name = document.getElementById("card_previewer_name")
	
	pr_name.style.transform = ""
	setTimeout(function(){pr.transform = ""}, 100)
	timout_menu = setTimeout(function(){
		pr.display = "none"
		pr_name.style.display = "none"
	}, 400)
}


function open_(){
	window.location.href = "/" + global_tracks.path + "/" + global_tracks.tracks[current_show].path
}

function copyToClipboard(text) {
	const elem = document.createElement('textarea');
	elem.value = text;
	document.body.appendChild(elem);
	elem.select();
	document.execCommand('copy');
	document.body.removeChild(elem);
}
function share(){
	let url = new URL("/" + global_tracks.path + "/" + global_tracks.tracks[current_show].path, window.location.href)
	copyToClipboard(decodeURI(url.href))
	notice.Success(LANG.copied, 3000)
}

function confirm_delete(){
	notice.Error(`${LANG.delete} <a style="color:red">${current_show}</a>?`, false, [[LANG.yes, delete_], LANG.no])
}
function delete_(){
	if (local_storage.userName && local_storage.userPassword){
		let xhr = new XMLHttpRequest();
		xhr.open("POST", `../api/delete_track`, false)
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.send(JSON.stringify({
			'artist': local_storage.userName,
			'password': local_storage.userPassword,
			'track_name': current_show
		}))
		if (xhr.status != 200){ notice.Error(LANG.error) }
		else{
			let answer = JSON.parse(xhr.response);
			if (!answer.successfully){ notice.Error(get_decode_error(answer.reason)) }
			else {
				notice.Success("OK")
				current_show_obj.remove()
				hide()
				ckeck_empty()
			}
		}
	}
}