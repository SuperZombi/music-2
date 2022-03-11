if (window.localStorage.getItem('lang')){
	language = window.localStorage.getItem('lang')
}
else{
	language = window.navigator.language.substr(0, 2)
}

(function executeIfFileExist() {
	var src = `../root_/Langs/${language.toUpperCase()}.json`;
	var xhr = new XMLHttpRequest()
	xhr.open('HEAD', src, true)
	xhr.onreadystatechange = function() {
		if (this.readyState === this.DONE) {
			if (xhr.status==200){
				var l = document.createElement("script")
				l.setAttribute("src", `../root_/Langs/${language.toUpperCase()}.json`);
				document.head.appendChild(l);
			}
			else{
				var l = document.createElement("script")
				l.setAttribute("src", `../root_/Langs/EN.json`);
				document.head.appendChild(l);
			}
		}
	}
	xhr.send();
})()