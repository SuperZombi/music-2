window.onload = function() {
	(function load_page(){
	if (typeof header !== 'undefined' && typeof body !== 'undefined'){
		document.title = `Zombi Music - ${LANG.support_title}`
		document.body.innerHTML += header
		document.body.innerHTML += body

		setTimeout(function(){document.body.style.transition = "1s"}, 500)
	}
	else{
		setTimeout(function(){load_page()}, 500)
	}
	})()
}

function empty(){
	return `
		<h2 class="empty">
			${LANG.nothing_here} <br>
			¯\\_(ツ)_/¯
		</h2>`
}

function check_enter(e) {
	if (e.key === 'Enter' || e.keyCode === 13) {
		start_search()
	}
	else{
		let text = document.getElementById("search_label").value;
		if (text == ""){
			search_current = '';
			document.getElementById('search_results').innerHTML = "";
		}
	}
}

var search_current = '';
var type_current = '';
function start_search(){
	let text = document.getElementById("search_label").value.trim();
	let type = document.querySelector("input[name=search_type]:checked").value
	if (text != ""){
		if (search_current != text || type_current != type){
			let xhr = new XMLHttpRequest();
			xhr.open("POST", 'api/search')
			xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
			xhr.onload = function() {
				if (xhr.status == 200){
					search_current = text;
					type_current = type;
					let answer = JSON.parse(xhr.response);
					console.log(answer)
					if (answer.length > 0){
						document.getElementById('search_results').innerHTML = "";
						if (type == "genre"){
							let genres = sortByGenre(answer);
							Object.keys(genres).forEach(function(e){
								addNewCategory(genres[e], type, e)
							})
						}
						else{
							addNewCategory(answer, type)
						}
					}
					else{
						document.getElementById('search_results').innerHTML = empty();
					}
				}
			}
			xhr.send(JSON.stringify({'text': text, 'type': type}))
		}
	}
}

async function addNewCategory(tracks, type, category_title){
	await new Promise((resolve, reject) => {
		var html = ""
		if (type == "track" || type == "genre"){
			tracks.forEach(function(e){
				let img = document.createElement('img');
				img.className = "loader"
				img.src = `${e.path}/${e.image}?size=small`
				img.alt = "";
				img.onload = ()=>img.classList.remove("loader");
				html += `
					<a href="${e.path}" class="about_box">
						${img.outerHTML}
						<div class="track_name"><span>${e.track}</span></div>
						<div class="artist">${e.artist}</div>
					</a>
				`
			})
		}
		else if (type == "user"){
			tracks.forEach(function(e){
				let img = document.createElement('img');
				img.className = "loader"
				img.src = `${e.image}?size=small`
				img.alt = "";
				img.onload = ()=>img.classList.remove("loader");
				html += `
					<a href="${e.path}" class="about_box">
						${img.outerHTML}
						<div class="track_name"><span>${e.user}</span></div>
					</a>
				`
			})
		}

		if (type == "genre"){
			document.getElementById("search_results").innerHTML += `
				<div class="category flexable">
					<div class="category_title">${category_title}</div>
					<div class="category_body">
						${html}
					</div>
				</div>
			`;
		}
		else {
			document.getElementById("search_results").innerHTML += `
				<div class="category flexable">
					<div class="category_body">
						${html}
					</div>
				</div>
			`;
		}
		resolve()
	});
}

function sortByGenre(tracks){
	var genres = {};
	Object.keys(tracks).forEach(function(e){
		let temp_genr = toTitleCase(tracks[e].genre);
		if (!genres.hasOwnProperty(temp_genr)){
			genres[temp_genr] = [];
		}
		genres[temp_genr].push(tracks[e]);
	})
	return genres
}
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}
