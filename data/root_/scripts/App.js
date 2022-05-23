function parseHTML(html) {
	let temp = html.split("<").filter(n=>n)[0].split(" ")
	let elem = temp[0]
	let atrs = temp.slice(1,)
	atrs[atrs.length-1] = atrs[atrs.length-1].split(">")[0]

	let htmlEl = document.createElement(elem)
	atrs.forEach(atr=>{
		htmlEl.setAttributeNode(parseAtribute(atr))
	})
	return htmlEl;
}
function parseAtribute(string){
	let arr = string.split("=")
	let a = document.createAttribute(arr[0])
	a.value = arr[1].replace(/['"]+/g, '')
	return a;
}

function loadApp(imports){
	let array = imports.split('\n').map(e=>e.trim()).filter(n=>n);

	function next(arr) {
		if (arr.length) {
			function load_source(element){
				element.onload = function() { next(arr) };
				el.onerror = function() { load_source(element) };
				document.head.appendChild(el)
			}
			let el = parseHTML(arr.shift())
			load_source(el)
		}
	}
	next(array);
}
