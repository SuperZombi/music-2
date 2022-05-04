if (location.hash){
	language = location.hash.split("#")[1]
}
else if (window.localStorage.getItem('lang')){
	language = window.localStorage.getItem('lang')
	location.hash = language
}
else{
	language = window.navigator.language.substr(0, 2)
	location.hash = language
}

(function executeIfFileExist() {
	var src = `/root_/Langs/${language.toUpperCase()}.json`;
	var xhr = new XMLHttpRequest()
	xhr.open('HEAD', src, true)
	xhr.onreadystatechange = function() {
		if (this.readyState === this.DONE) {
			if (xhr.status==200){
				function langLoaderHelper(){
					var l = document.createElement("script")
					l.setAttribute("src", `/root_/Langs/${language.toUpperCase()}.json`);
					l.onerror = function(){langLoaderHelper()}
					document.head.appendChild(l);
				}
				langLoaderHelper()
				window.localStorage.setItem('lang', language);
			}
			else{
				function langLoaderHelper(){
					var l = document.createElement("script")
					l.setAttribute("src", `/root_/Langs/EN.json`);
					l.onerror = function(){langLoaderHelper()}
					document.head.appendChild(l);
				}
				langLoaderHelper()
				var th = location.hash.split("#")[2]
				if (typeof th === 'undefined'){
					location.hash = "en"
				}
				else{
					location.hash = `#en#${th}`
				}
			}
		}
	}
	xhr.send();
})()
