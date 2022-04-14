window.onload = function() {
	(function load_page(){
	if (typeof header !== 'undefined' && typeof body !== 'undefined' && typeof footer !== 'undefined'){
		document.body.innerHTML += header
		document.body.innerHTML += body
		document.body.innerHTML += footer

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

function darking_images(){
	if (document.getElementById('artist_image').src.split('.').pop() == "svg"){
		try_dark(document.getElementById('artist_image'))
	}
}

async function main(){
	document.title = ARTIST.name
	let img = document.getElementById('artist_image');
	img.className = "loader";

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
	if (img.src.split('.').pop() == "svg"){
		try_dark(img)
	}

	loadArtistProfileData()

	initTabs()

	try{ var tracks = getAllAuthorTracks(ARTIST.name);}
	catch{ document.getElementById("main_page").innerHTML = empty();}
	
	if (tracks.length == 0){
		document.getElementById("main_page").innerHTML = empty();
	}
	else{
		await addNewCategory(sortByDate(tracks))
		overflowed()
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
		var html = ""
		tracks.forEach(function(e){
			let img = document.createElement('img');
			img.className = "loader"
			img.src = `../${e.href}/${e.image}?size=small`
			img.onload = ()=>img.classList.remove("loader");
			html += `
				<a href="../${e.href}" class="about_box">
					${img.outerHTML}
					<div class="track_name"><span>${e.track}</span></div>
				</a>
			`
		})
		document.getElementById("main_page").innerHTML += `
			<div class="category">
				<div class="category_body">
					${html}
				</div>
			</div>
		`;
		resolve()
	});
}

function getAllAuthorTracks(author, obj=true){
	if (obj){
		var tracks = bd[author].tracks
		var tracks_obj = []
		Object.keys(tracks).forEach(function(e){
			var _temp = Object.assign({"author":author,"track":e, "href":`${bd[author].path}/${tracks[e].path}`}, tracks[e])
			tracks_obj.push(_temp)
		})
		return tracks_obj
	}
	return Object.keys(bd[author].tracks)
}

function sortByDate(what){
	what.forEach(function(e){
		var tmp = e.date.split(".")
		var x = new Date(tmp[2], tmp[1]-1, tmp[0])
		e.date = x
	})
	return what.sort((a, b) => b.date - a.date)
}

function loadArtistProfileData(){
	let xhr = new XMLHttpRequest();
	xhr.open("POST", `../api/get_user_profile_public`)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.onload = function() {
		if (xhr.status == 200){
			let answer = JSON.parse(xhr.response);
			if (answer.successfully){
				if (answer.public_fields.official){
					document.getElementById("official_checkmark").style.display = "inline-block";
				}
				delete answer['public_fields']['official'];
				buildAbout(answer.public_fields)
			}
		}
	}
	xhr.send(JSON.stringify({
		'user': ARTIST.name
	}))
}
function checkmark_hovered(e){
	e.classList.remove("checkmark__animation")
	setTimeout(function(){
		e.classList.add("checkmark__animation")
	}, 100)
}

function empty(){
	return `
		<h2 class="empty">
			${LANG.nothing_here} <br>
			¯\\_(ツ)_/¯
		</h2>`
}

function buildAbout(arr){
	if (Object.keys(arr).length == 0){
		document.getElementById("about").getElementsByTagName("table")[0].style.display = "none";
		document.getElementById("about").innerHTML = empty();
	}
	Object.keys(arr).forEach(function(e){
		let tr = document.createElement("tr");
		let td1 = document.createElement("td");
		let td2 = document.createElement("td");
		tr.appendChild(td1);
		tr.appendChild(td2);
		document.getElementById("about").getElementsByTagName("table")[0].appendChild(tr);

		try{td1.innerHTML = LANG[e];}catch{td1.innerHTML = e;}
		td2.innerHTML = arr[e];

		if (e == "email"){
			td1.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-envelope"></i>')
			td2.innerHTML = `<a href="mailto:${arr[e]}">${arr[e]}</a>`
		}
		else if (e == "gender"){
			td1.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-person"></i>')
			try{td2.title = LANG[arr[e]];}catch{td2.title = arr[e];}
			if (arr[e] == "man"){
				td2.innerHTML = '<i style="color:#00c0ff" class="fa-solid fa-mars"></i>'
			}
			else if (arr[e] == "woman"){
				td2.innerHTML = '<i style="color:#f766ad" class="fa-solid fa-venus"></i>'
			}
		}
		else if (e == "phone"){
			td1.insertAdjacentHTML("afterbegin", '<i class="fa-solid fa-phone"></i>')
			td2.innerHTML = `<a href="tel:${arr[e]}">${arr[e]}</a>`
		}
	})
}

function changeTab(element, no_animete=false){
	let old_elem = document.querySelector(".tabs > li.active")
	if (old_elem == element){return}

	if (no_animete){
		old_elem.classList.add("no-animation")
		element.classList.add("no-animation")
		old_elem.classList.remove("active");
		element.classList.add("active");
		animate(old_elem, element, 0);
		setTimeout(function(){
			old_elem.classList.remove("no-animation")
			element.classList.remove("no-animation")
		},0)
		return;
	}

	old_elem.classList.remove("active")
	element.classList.add("active")

	function animate(from, to, time=350){
		let to_change = {"main": "#main_page", "all-tracks": "#main_page", "about": "#about"}
		let old = document.querySelector(to_change[from.getAttribute("data")])
		let new_ = document.querySelector(to_change[to.getAttribute("data")])
		if (old != new_){
			old.style.opacity = 0;
			new_.style.display = "block";
			setTimeout(function(){
				old.style.display = "none";
				new_.style.opacity = 1;
			},time)
		}
	}
	animate(old_elem, element)

	let data = element.getAttribute("data")

	let temp_url = new URL(window.location.href);
	if (data == "main"){ temp_url.search = "" }
	else{ temp_url.search = data }

	window.history.pushState({path:temp_url.href},'',temp_url.href);

	if (data=="main"){
		document.getElementById("main_page").querySelector(".category").classList.remove("flexable")
	}
	if (data=="all-tracks"){
		document.getElementById("main_page").querySelector(".category").classList.add("flexable")
	}
}
function initTabs(){
	Array.from(document.querySelectorAll(".tabs > li")).forEach(el=>{
		el.onclick = ()=>changeTab(el);
	})
	let loc_seach = window.location.search.replace("?", "");
	if (loc_seach){
		changeTab(document.querySelector(`.tabs > li[data=${loc_seach}]`), true)
	}
}
