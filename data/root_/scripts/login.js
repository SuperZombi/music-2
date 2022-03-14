function passwordToggle(what){
	var input = what.parentNode.getElementsByTagName("input")[0]
	if (input.type === "password") {
		input.type = "text";
		what.classList.add("fa-eye-slash");
		what.title = LANG.hide;
	}
	else {
		input.type = "password";
		what.classList.remove("fa-eye-slash");
		what.title = LANG.show;
	}
}

function get_decode_error(code){
	let xhr = new XMLHttpRequest();
	xhr.open("POST", '../api/decode_error', false)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.send(JSON.stringify({'code': code, 'lang': language}))
	if (xhr.status != 200){ return code }
	else{
		answer = JSON.parse(xhr.response)
		if (!answer.successfully){ return code }
		else{ return answer.value }			
	}
}

function validName(input){
	let xhr = new XMLHttpRequest();
	xhr.open("POST", '../api/name_available', false)
	xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
	xhr.send(JSON.stringify({'name': input.value}))
	if (xhr.status != 200){ return false }
	else{
		answer = JSON.parse(xhr.response)
		if (!answer.available){
			input.setCustomValidity(get_decode_error(answer.reason));
			input.reportValidity();
			input.onkeydown = _=> input.setCustomValidity('');
			return false;
		}
		else{ return true }
	}
}

function confirmPassword(main, child){
	if(main.value != child.value) {
		child.setCustomValidity("Passwords Don't Match");
		child.reportValidity();
		main.onchange = _=> child.setCustomValidity('');
		child.onkeydown = _=> child.setCustomValidity('');
		return false;
	}
	else {
		child.setCustomValidity('');
		return true;
	}
}

function action_(){
	var type = document.querySelector('input[name="form_action"]:checked').value;
	var form = document.querySelector(`form[name="${type}"]`);

	if (form.querySelector('input[name="confirm_password"]')){
		if (
			confirmPassword(
				form.querySelector('input[name="password"]'),
				form.querySelector('input[name="confirm_password"]')
			)
		)
		{
			parseForm(type, form)
		}
	}
	else{
		parseForm(type, form)
	}
}

function parseForm(type, form){
	var elements = Array.from(form.elements).filter(e => e.tagName.toLowerCase() != "button");
	elements = elements.filter(e => e.value);
	var final = {}
	elements.map(e => {
		if (e.name != "confirm_password"){
			final[e.name] = e.value;
		}
	})
	// console.log(type);
	// console.log(final);

	if (type == "signup"){
		if ( validName(form.querySelector('input[name="name"]')) ){
			final.password = CryptoJS.MD5(final.password).toString();

			let xhr = new XMLHttpRequest();
			xhr.open("POST", '../api/register', false)
			xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
			xhr.send(JSON.stringify(final))
			if (xhr.status == 200){
				answer = JSON.parse(xhr.response)
				if (!answer.successfully){
					notice.Error(get_decode_error(answer.reason))
				}
				else{
					notice.Success("OK")
					window.localStorage.setItem("userName", final.name)
					window.localStorage.setItem("userPassword", final.password)
					afterLogin()
				}
			}
		}
	}
	if (type == "login"){
		final.password = CryptoJS.MD5(final.password).toString();

		let xhr = new XMLHttpRequest();
		xhr.open("POST", '../api/login', false)
		xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
		xhr.send(JSON.stringify(final))
		if (xhr.status == 200){
			answer = JSON.parse(xhr.response)
			if (!answer.successfully){
				if (answer.wait){
					notice.Warning(LANG.too_many_tries.replace("%", answer.sleep))
				}
				else{
					notice.Error(get_decode_error(answer.reason))
				}
			}
			else{
				notice.Success("OK")
				window.localStorage.setItem("userName", final.name)
				window.localStorage.setItem("userPassword", final.password)
				afterLogin()
			}
		}
	}	
}

function afterLogin(){
	setTimeout(function(){
		if (searchParams.redirect){
			window.location = searchParams.redirect;
		}
	}, 1000)
}

window.onload = function(){
	(function load_page(){
		if (typeof header !== 'undefined' && typeof body !== 'undefined'){
			document.title = `${LANG.login_title} - Zombi Music`
			document.body.innerHTML += header
			document.body.innerHTML += body
			main()
		}
		else{
			setTimeout(function(){load_page()}, 100)
		}
	})()
}

function main(){
	notice = Notification('#notifications');

	const urlSearchParams = new URLSearchParams(window.location.search);
	searchParams = Object.fromEntries(urlSearchParams.entries());

	var rad = document.querySelectorAll('input[name="form_action"]');
	for (var i = 0; i < rad.length; i++) {
		rad[i].addEventListener('change', function() {
			if (this.value == "signup"){
				document.querySelector(".flip-card").style.transform = "rotateY(180deg)"
				document.querySelector(".flip-card-front").style.display = "none"
				document.querySelector(".flip-card-back").style.display = "block"
				document.querySelector("#notifications").classList.add("notifications_top")
				location.hash = "signup"
			}
			else if(this.value == "login"){
				document.querySelector(".flip-card").style.transform = "rotateY(0deg)"
				document.querySelector(".flip-card-front").style.display = "block"
				document.querySelector(".flip-card-back").style.display = "none"
				document.querySelector("#notifications").classList.remove("notifications_top")
				location.hash = ""
				history.replaceState("", "", location.pathname)
			}
		});
	}
	
	if (window.location.hash.split('#')[1] == "signup"){
		document.querySelector(".flip-card").style.transform = "rotateY(180deg)"
		document.querySelector(".flip-card-front").style.display = "none"
		document.querySelector(".flip-card-back").style.display = "block"
		document.querySelectorAll('input[name="form_action"]')[1].checked = true
	}
}
