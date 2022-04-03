from enum import Enum

class Errors(Enum):
	incorrect_name_or_password = {
		'en': "The username or password you entered is incorrect!",
		'ru': "Неверное имя пользователя или пароль!"
	}
	forbidden_character = {
		'en': "Forbidden character in nickname!",
		'ru': "Запрещённый символ в нике!"
	}
	track_forbidden_character = {
		'en': "Forbidden character in track name!",
		'ru': "Запрещённый символ в названии трека!"
	}
	user_dont_exist = {
		'en': "This user does not exist!",
		'ru': "Такого пользователя не существует!"
	}
	name_already_taken = {
		'en': "This nickname is already taken!",
		'ru': "Этот ник уже занят!"
	}
	track_already_exists = {
		'en': "Track already exists!",
		'ru': "Трек уже существует!"
	}
	track_dont_exists = {
		'en': "This track does not exist!",
		'ru': "Этого трека не существует!"
	}	
	creating_folder_error = {
		'en': "Error creating folder on server! A similar name with a different case is already taken.",
		'ru': "Ошибка создания папки на сервере! Аналогичное имя с другим регистром уже занято."
	}
	invalid_parameters = {
		'en': "Invalid parameters!",
		'ru': "Неверные параметры!"
	}
	error_working_files = {
		'en': "Error while working with files. Please contact the administrator.",
		'ru': "Ошибка при работе с файлами. Пожалуйста, обратитесь к администратору."
	}
