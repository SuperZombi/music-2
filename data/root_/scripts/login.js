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
	console.log(type);
	console.log(final);
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
	var rad = document.querySelectorAll('input[name="form_action"]');
	for (var i = 0; i < rad.length; i++) {
		rad[i].addEventListener('change', function() {
			if (this.value == "signup"){
				document.querySelector(".flip-card").style.transform = "rotateY(180deg)"
				document.querySelector(".flip-card-front").style.display = "none"
				document.querySelector(".flip-card-back").style.display = "block"
				location.hash = "signup"
			}
			else if(this.value == "login"){
				document.querySelector(".flip-card").style.transform = "rotateY(0deg)"
				document.querySelector(".flip-card-front").style.display = "block"
				document.querySelector(".flip-card-back").style.display = "none"
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
