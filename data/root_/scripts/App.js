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

async function load_source(element){
	await new Promise((resolve, reject) => {
		let link = element.src || element.href;
		fetch(link)
			.then((response) => {
				if (response.ok) {
					load_this(response.blob())
				}
				else{
					console.log(`Reloading ${link}`)
					load_source(element)	
				}
			});
		async function load_this(data){
			var data = await data;
			var url = window.URL.createObjectURL(data);
			if (element.src){ element.src = url }
			else if (element.href){ element.href = url }
			document.head.appendChild(element)
			resolve()
		}
	});
}

function loadApp(imports){
	let array = imports.split('\n').map(e=>e.trim()).filter(n=>n);
	function next(arr) {
		if (arr.length) {
			let el = parseHTML(arr.shift())
			load_source(el)
			next(arr)
		}
	}
	next(array);
}
