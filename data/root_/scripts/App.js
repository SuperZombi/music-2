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
	    	let el = parseHTML(arr.shift())
	    	el.onload = function() { next(arr) };
	    	el.onerror = function() { document.head.appendChild(el) };
	    	document.head.appendChild(el)
	    }
	}
	next(array);
}