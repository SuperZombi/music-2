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
		setTimeout(function(){load_page()}, 100)
	}
	})()
}
window.onresize = function(){ overflowed() }
window.orientationchange = function(){ overflowed() }
window.onscroll = function(){showScrollTop()}

function darking_images(){
	if (document.getElementById('artist_image').src.split('.').pop() == "svg"){
		try_dark(document.getElementById('artist_image'))
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

function empty(){
	return `
		<h2 class="empty">
			${LANG.nothing_here} <br>
			¯\\_(ツ)_/¯
		</h2>`
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
	local_storage = { ...localStorage };
	if (local_storage.userName && local_storage.userPassword){
		let a = document.createElement('a')
		a.href = "#";
		a.title = LANG.open_profile;
		a.innerHTML = local_storage.userName;
		document.getElementById("user-name").appendChild(a);

		notice = Notification('#notifications');
		document.querySelector("#notifications").classList.add("notifications_top")
		document.querySelector(".logout > svg").style.display = "block"
		document.querySelector(".logout > svg").onclick = logout

		submain()
	}
	else{
		goToLogin()
	}

	document.querySelectorAll('details').forEach((el) => {
		new Accordion(el);
	});

	document.body.onclick = event => checkHideMenu(event)

	if (document.getElementById('artist_image').src.split('.').pop() == "svg"){
		try_dark(document.getElementById('artist_image'))
	}
	var tmp_ = document.getElementById("new-release")
	if (tmp_){
		tmp_2 = tmp_.getElementsByTagName("img")
		Object.keys(tmp_2).forEach(function(e){
			try_dark(tmp_2[e])
		})
	}
}

function loadProfileImage(){
	let xhr = new XMLHttpRequest();
	xhr.open("POST", '../api/get_profile_photo')
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.onload = function() {
		if (xhr.status == 200){ 
			let answer = JSON.parse(xhr.response);
			if (answer.successfully){
				let img = document.getElementById("artist_image");
				img.src = "";
				img.className = "loader";
				var image_href = new URL("/" + answer.image, window.location.href).href
				img.src = image_href;
				img.onload = ()=>{
					if (img.width < img.height){
						img.style.maxWidth = "100%";
						img.style.maxHeight = "unset";
					}
					else{
						img.style.maxHeight = "100%";
						img.style.maxWidth = "unset";
					}
					img.classList.remove("loader")
				};
				if (image_href.split('.').pop() == "svg"){
					try_dark(img)
				}
			}
		}
	}
	xhr.send(JSON.stringify({'artist': local_storage.userName}))
}

var global_tracks;
async function submain() {
	loadProfileImage();
	loadSettings();
	settingsController();

	let xhr = new XMLHttpRequest();
	xhr.open("POST", '../api/get_tracks', false)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.send(JSON.stringify({'user': local_storage.userName}))
	if (xhr.status != 200){ notice.Error(LANG.error) }
	else{
		let answer = JSON.parse(xhr.response);
		if (answer.successfully){
			global_tracks = answer.tracks
			document.getElementById("user-name").getElementsByTagName('a')[0].href = "/" + global_tracks.path
			if (Object.keys(global_tracks.tracks).length == 0){
				document.getElementById("empty").innerHTML = empty();
			}
			else{
				await addNewCategory(sortByDate(getAllAuthorTracks(answer.tracks)))
				overflowed()
			}
		}
	}
}


function settingsController(){
	function removeHash() { 
		history.pushState("", document.title, window.location.pathname + window.location.search);
	}
	if (location.hash.substring(1) == "settings"){
		document.getElementById("settings").open = true;
	}
	document.getElementById("settings").addEventListener("toggle", ()=>{
		if (document.getElementById("settings").hasAttribute("open")){
			location.hash = "settings"
		}
		else{
			removeHash()
		}
	})
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
		tracks.forEach(function(e){
			var a = document.createElement('a');
			a.className = "about_box";
			a.onclick = ()=>show(e.track, a);

			let img = document.createElement('img');
			img.className = "loader"
			img.src = `../${e.href}/${e.image}?size=small`
			img.onload = ()=>img.classList.remove("loader");

			a.innerHTML = `
					${img.outerHTML}
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

function validateImage(file){
	if (file && file['type'].split('/')[0] === 'image'){
		if (file.size <= 2097152) {
			var _URL = window.URL || window.webkitURL;
			var img = new Image();
			var objectUrl = _URL.createObjectURL(file);
			return new Promise((resolve, reject) => {
				img.onload = function () {
						if (img.width <= 1280 || img.height <= 1280){
							_URL.revokeObjectURL(objectUrl);
							resolve([true]);
						}
						_URL.revokeObjectURL(objectUrl);
				};
				img.src = objectUrl;
			})
		}
		return [false, LANG.file_too_big];
	}
	return [false, LANG.wrong_file_format];
}

function sendFile(file){
	var formData = new FormData();
	formData.append('artist', local_storage.userName);
	formData.append('password', local_storage.userPassword);
	formData.append('image', file);

	let req = new XMLHttpRequest();                          
	req.open("POST", '../api/change_profile_photo');
	req.onload = function() {
		if (req.status != 200){notice.Error(LANG.error)}
		else{
			answer = JSON.parse(req.response)
			if (!answer.successfully){ notice.Error(get_decode_error(answer.reason)) }
			else{
				notice.clearAll()
				notice.Success(LANG.files_uploaded)
				loadProfileImage()
			}
		}
	}
	req.onerror = _=> notice.Error(LANG.error);
	req.send(formData);
}
function selectFile(){
	var input = document.createElement('input');
	input.type = 'file';
	input.accept = "image/png, image/jpeg";
	input.onchange = async e => { 
		var file = e.target.files[0];
		let valide = await validateImage(file);
		if (valide[0]){
			sendFile(file)
		}
		else{
			notice.Error(valide[1])
		}
	}
	input.click();
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
	document.getElementById("extra_space").style.height = "100px"
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
	document.getElementById("extra_space").style.height = "0px"
	setTimeout(function(){pr.transform = ""}, 100)
	timout_menu = setTimeout(function(){
		pr.display = "none"
		pr_name.style.display = "none"
	}, 400)
}

function checkHideMenu(e){
	for (let i=0; i<e.path.length;i++){
		if (e.path[i] == document.getElementById("card_previewer")){
			return
		}
		if (e.path[i] == document.getElementById("card_previewer_name")){
			return
		}
		if (e.path[i].className == "about_box"){
			return
		}
		if (e.path[i] == document.getElementById("header")){
			return
		}
		if (e.path[i] == document.getElementById("notifications")){
			return
		}
	}
	hide()
}


function open_(){
	window.location.href = "/" + global_tracks.path + "/" + global_tracks.tracks[current_show].path
}
function edit(){
	let url = new URL("new-release", window.location.href);
	url.searchParams.append('edit', current_show);
	window.location.href = url.href;
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
	notice.clearAll()
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
				delete global_tracks.tracks[current_show]
				if (Object.keys(global_tracks.tracks).length == 0){
					document.getElementById("empty").innerHTML = empty();
				}
			}
		}
	}
}
function confrim_delete_avatar(){
	notice.clearAll()
	notice.Error(`${LANG.delete_avatar_confirm}`, false, [[LANG.yes, delete_avatar], LANG.no])
}
function delete_avatar(){
	if (local_storage.userName && local_storage.userPassword){
		var formData = new FormData();
		formData.append('artist', local_storage.userName);
		formData.append('password', local_storage.userPassword);
		formData.append('delete', true);
		let xhr = new XMLHttpRequest();
		xhr.open("POST", `../api/change_profile_photo`, false)
		xhr.send(formData)
		if (xhr.status != 200){ notice.Error(LANG.error) }
		else{
			let answer = JSON.parse(xhr.response);
			if (!answer.successfully){ notice.Error(get_decode_error(answer.reason)) }
			else {
				notice.clearAll()
				notice.Success(LANG.avatar_deleted)
				loadProfileImage()
			}
		}
	}
}

function validatePhoneNumber(input_str) {
	var re = /^[+]\d[\d\(\)\ -]{6,14}\d$/;
	return re.test(input_str);
}
function validateEmail(input_str) {
  var re = /^[\w]{1}[\w-\.]*@[\w-]+\.[a-z]{2,4}$/i;
  return re.test(input_str);
}

var global_profile_data = {};
function loadSettings() {
	let available_settings = ["lang", "theme", "hard-anim"]
	Object.keys(local_storage).forEach(function(e){
		if (available_settings.includes(e)){
			let inputs = document.querySelectorAll(`.settings_element input[name=${e}]`)
			let input = Array.from(inputs).filter(i=>i.value==local_storage[e])[0]
			try{input.checked = true;}catch{}
		}
	})

	function loadProfileValues(data){
		var phone_input = document.querySelector(".settings_element input[type=tel]");
		phoneMask = IMask(
		phone_input, {
			mask: '+(000) 00-00-00-00000'
		});

		global_profile_data = data;
		Object.keys(data).forEach(function(i){
			if (i != "public_fields"){
				if (i == "gender"){
					let select = document.querySelector(`.settings_element select[name=${i}]`)
					select.value = data[i]
					select.dataset.chosen = data[i]
				}
				else if (i == "official"){
					delete global_profile_data["official"]
				}
				else if (i == "phone"){
					phoneMask.unmaskedValue = data[i];
				}
				else{
					try{
						let input = document.querySelector(`.settings_element input[name=${i}]`)
						input.value = data[i];
					}catch{}
				}
				if ("public_fields" in data){
					if (data.public_fields.includes(i)){
						let toggle_input = Array.from(
												document.querySelectorAll(`.settings_element input[name=toggle_${i}]`)
												).filter(e=>e.value=="true")[0]
						toggle_input.checked = true;
					}
				}
			}
		})
	}

	let xhr = new XMLHttpRequest();
	xhr.open("POST", `../api/get_user_profile`)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.onload = function() {
		if (xhr.status == 200){
			let answer = JSON.parse(xhr.response);
			if (answer.successfully){
				document.getElementById("profile-settings").style.display = "block";
				loadProfileValues(answer.data)
			}
			else{
				console.error("/api/get_user_profile \n", get_decode_error(answer.reason))
			}
		}
		else{
			console.error("/api/get_user_profile")
		}
	}
	xhr.send(JSON.stringify({
		'name': local_storage.userName,
		'password': local_storage.userPassword
	}))
}
function changeSettings(e){
	if (e.value == "auto"){
		localStorage.removeItem(e.name);
	}
	else{
		localStorage.setItem(e.name, e.value);
	}
}
function saveSettings(){
	let inputs = document.querySelectorAll("#profile-settings > .settings_element input, select");
	var final = {}
	var final_all = {}
	var canSaveSettings = true;
	inputs.forEach(function(e){
		if (e.type == "radio"){
			if (e.checked){
				if (!("public_fields" in final)){
					final["public_fields"] = []
				}
				if (!("public_fields" in final_all)){
					final_all["public_fields"] = []
				}
				if (e.value == "true"){
					final_all.public_fields.push(e.name.replace("toggle_", ""));
					final.public_fields.push(e.name.replace("toggle_", ""));
				}
			}
			return;
		}
		else if (e.type == "email"){
			if (e.value.trim() != ""){
				if (!validateEmail(e.value.trim())){
					e.setCustomValidity(LANG.invalid_email);
					e.reportValidity();
					e.onkeydown = _=> e.setCustomValidity('');
					canSaveSettings = false;
				}
				else{
					final_all[e.name] = e.value.trim();
					final[e.name] = e.value.trim();
					return
				}
			}
		}
		else if (e.type == "tel"){
			if (phoneMask.unmaskedValue != "" || e.value){
				if (!validatePhoneNumber("+" + phoneMask.unmaskedValue)){
					e.setCustomValidity(LANG.invalid_phone);
					e.reportValidity();
					e.onkeydown = _=> e.setCustomValidity('');
					canSaveSettings = false;
				}
				else{
					final_all[e.name] = "+" + phoneMask.unmaskedValue;
					final[e.name] = "+" + phoneMask.unmaskedValue;
					return
				}
			}	
		}
		final_all[e.name] = e.value;
		if (e.value){
			final[e.name] = e.value;
		}
	})
	
	if (!canSaveSettings){return}

	if (!isEqual(global_profile_data, final)){
		let xhr = new XMLHttpRequest();
		xhr.open("POST", `../api/edit_user_profile`, false)
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.send(JSON.stringify({
			'name': local_storage.userName,
			'password': local_storage.userPassword,
			...final_all
		}))
		if (xhr.status != 200){ notice.Error(LANG.error) }
		else{
			let answer = JSON.parse(xhr.response);
			if (!answer.successfully){ notice.Error(get_decode_error(answer.reason)) }
			else {
				notice.Success("OK")
				setTimeout(()=>window.location.reload(), 500)
			}
		}
	}
	else{
		window.location.reload();
	}
}

function isEqual(object1, object2) {
	const props1 = Object.getOwnPropertyNames(object1);
	const props2 = Object.getOwnPropertyNames(object2);
	if (props1.length !== props2.length) { return false; }
	for (let i = 0; i < props1.length; i += 1) {
		const prop = props1[i];
		const bothAreObjects = typeof(object1[prop]) === 'object' && typeof(object2[prop]) === 'object';
		if ((!bothAreObjects && (object1[prop] !== object2[prop]))
		|| (bothAreObjects && !isEqual(object1[prop], object2[prop]))) {
			return false;
		}
	}
	return true;
}

function reset_password(){
	let url = window.location.pathname;
	let filename = url.substring(url.lastIndexOf('/')+1);
	if (filename == ""){
		filename = "../" + url.split("/").filter(x => x).at(-1)
	}

	let login = new URL("login", window.location.href);
	login.searchParams.append('redirect', filename);
	login.hash = "reset";

	window.location.href = decodeURIComponent(login.href)
}
