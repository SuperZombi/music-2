var tmp_th = window.localStorage.getItem('theme')
if(tmp_th){
	if (tmp_th == "dark"){
		darkThemeMq = true
		var l = document.createElement("link")
		l.rel = "stylesheet"
		l.setAttribute("href", "root_/styles/dark.css");
		document.head.appendChild(l)
	}
	else{
		darkThemeMq = false
	}
}
else{
	darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)").matches
	if (darkThemeMq) {
		var l = document.createElement("link")
		l.rel = "stylesheet"
		l.setAttribute("href", "root_/styles/dark.css");
		document.head.appendChild(l)
	}
}

window.onload = function(){
	_404()
}
function _404(){
	document.onmousemove = function(e){
		var targetNode = document.getElementById("404");
		let centerX = targetNode.offsetLeft + targetNode.offsetWidth / 2;
		let centerY = targetNode.offsetTop + targetNode.offsetHeight / 2;

		x1 = (centerX - e.x) /10;
		y1 = (centerY - e.y) /10;

		if (x1 > 30) { x1 = 30 }
		if (y1 > 30){ y1 = 30 }
		if (x1 < -30) { x1 = -30 }
		if (y1 < -30){ y1 = -30 }
			
		document.getElementById("404").style.filter = `drop-shadow(${x1}px ${y1}px 20px grey)`;
	}	
}