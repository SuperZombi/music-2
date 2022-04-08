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

	await addNewCategory(sortByDate(getAllAuthorTracks(ARTIST.name)))
	overflowed()	
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
