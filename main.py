import os
import shutil
import time
from dateutil import parser as dataparse
from flask import Flask, request, jsonify, send_from_directory, send_file, abort, redirect
from flask_cors import CORS
import json
import filetype
from PIL import Image
from io import BytesIO
import audio_metadata
import warnings
warnings.filterwarnings('ignore')
# import re
from tools.serverErrors import Errors
from tools.BrootForceProtection import BrootForceProtection
import tools.htmlTemplates as htmlTemplates
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False
CORS(app)

@app.route("/status")
def status():
	ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	return jsonify({'online': True, 'time': int(time.time()),
					'ip': ip})

@app.route("/")
def index():
	return send_from_directory('data', 'index.html')

@app.route('/<path:filepath>')
def data(filepath):
	p = os.path.join("data", filepath)
	if os.path.exists(p):
		if os.path.isfile(p):
			if filetype.is_image(p):
				if 'size' in request.args.keys():
					if request.args['size'] == "small":
						try:
							img = Image.open(p)
							img.thumbnail((200, 200), Image.ANTIALIAS)
							buf = BytesIO()
							img.save(buf, img.format)
							buf.seek(0)
							return send_file(buf, mimetype=filetype.guess(p).mime)
						except:
							None
			return send_from_directory('data', filepath)
		if filepath[-1] != "/":
			return redirect("/" + filepath + "/")
		if os.path.isfile(os.path.join(p, 'index.html')):
			return send_from_directory('data', os.path.join(filepath, 'index.html'))
	if os.path.isfile(p + '.html'):
		return send_from_directory('data', filepath + '.html')
	abort(404)

@app.route("/api/lang_detect")
def lang_detect():
	return send_from_directory('tools', 'lang_detect.html')

@app.route("/api/decode_error", methods=["POST"])
def get_error_value():
	if 'lang' in request.json.keys():
		lang = request.json['lang'].lower()

	try:
		temp = Errors[request.json['code']].value
		if isinstance(temp, dict):
			if lang in temp.keys():
				return {'successfully': True, 'value': temp[lang]}
			return {'successfully': True, 'value': temp['en']} # default
		return temp
	except:
		return {'successfully': False}

# Method deprecated
# @app.route('/api/get_all_tracks')
# def get_all_tracks():
# 	unswer = []
# 	for user, array in tracks.items():
# 		for track in array['tracks']:
# 			unswer.append( user.lower().replace(" ", "-") + "/" + track.lower().replace(" ", "-")  )
# 	return jsonify(unswer)

@app.route('/api/get_tracks', methods=["POST"])
def get_tracks():
	if request.json['user'] in users.keys():
		if request.json['user'] in tracks.keys():
			return jsonify({'successfully': True, 'tracks': tracks[request.json['user']]})
		else:
			temp = {}
			temp['path'] = request.json['user'].lower().replace(" ", "-")
			temp['tracks'] = {}
			return jsonify({'successfully': True, 'tracks': temp})
	else:
		return jsonify({'successfully': False, 'reason': Errors.user_dont_exist.name})

users = {}
def load_users():
	global users
	try:
		with open('users.bd', 'r', encoding='utf8') as file:
			users = json.loads(file.read())
	except FileNotFoundError:
		None
load_users()

def save_users():
	with open('users.bd', 'w', encoding='utf8') as file:
		file.write(json.dumps(users, indent=4, ensure_ascii=False))
def register_user(data):
	temp = {}
	temp[data['name']] = {}
	temp[data['name']]['password'] = data['password']
	temp[data['name']]['registration_time'] = int(time.time())

	if 'email' in data.keys():
		temp[data['name']]['email'] = data['email']

	if 'gender' in data.keys():
		temp[data['name']]['gender'] = data['gender']

	if 'phone' in data.keys():
		temp[data['name']]['phone'] = data['phone']	

	global users
	users.update(temp)

def edit_user(user, data):
	global users
	temp = dict(users[user])

	for i in data.keys():
		if i == "name" or i == "password" or i == "public_fields":
			pass
		else:
			if data[i].strip() == "":
				if i in temp.keys():
					del users[user][i]
			else:
				users[user][i] = data[i]

	publicFields = []
	if "public_fields" in data.keys():
		for i in data["public_fields"]:
			if i in data["public_fields"] and i in users[user]:
				publicFields.append(i)
	if len(publicFields) == 0:
		if "public_fields" in users[user].keys():
			del users[user]["public_fields"]
	else:
		users[user]["public_fields"] = publicFields

tracks = {}
def load_tracks():
	global tracks
	try:
		with open(os.path.join('data', 'root_', 'bd.json'), 'r', encoding='utf8') as file:
			string = file.read()
			string = string.split('=', 1)[1]
			
			# regex = r'''(?<=[}\]"']),(?!\s*[{["'])'''
			# string = re.sub(regex, "", string, 0)
			
			tracks = json.loads(string)
	except FileNotFoundError:
		None
load_tracks()

def save_tracks():
	global tracks
	with open(os.path.join('data', 'root_', 'bd.json'), 'w', encoding='utf8') as file:
		file.write('bd = ' + json.dumps(tracks, indent=4, ensure_ascii=False))

def user_exists(artist):
	return artist in tracks.keys()
def track_exists(artist, track):
	if user_exists(artist):
		return track in tracks[artist]['tracks'].keys()
	return False

def add_user(artist):
	global tracks
	tracks[artist] = {}
	tracks[artist]['path'] = artist.lower().replace(" ", "-")
	tracks[artist]['tracks'] = {}

def add_track(artist, track_name, genre, image, date):
	global tracks
	if not user_exists(artist):
		add_user(artist)
	tracks[artist]['tracks'][track_name] = {}
	tracks[artist]['tracks'][track_name]["path"] = track_name.lower().replace(" ", "-")
	tracks[artist]['tracks'][track_name]["genre"] = genre
	tracks[artist]['tracks'][track_name]["image"] = image

	d = dataparse.parse(date)
	d_str = f'{str(d.day).zfill(2)}.{str(d.month).zfill(2)}.{d.year}'

	tracks[artist]['tracks'][track_name]["date"] = d_str

def edit_track(artist, track_name, genre, date):
	global tracks
	if track_exists(artist, track_name):
		tracks[artist]['tracks'][track_name]["genre"] = genre

		d = dataparse.parse(date)
		d_str = f'{str(d.day).zfill(2)}.{str(d.month).zfill(2)}.{d.year}'

		tracks[artist]['tracks'][track_name]["date"] = d_str

def remove_track(artist, track_name):
	global tracks
	if track_exists(artist, track_name):
		del tracks[artist]['tracks'][track_name]
		return True

# Method deprecated
# @app.route("/api/user_exists", methods=["POST"])
# def user_exists_post():
	# if request.json['name'] in users.keys():
	# 	return jsonify({'exist': True})
	# return jsonify({'exist': False})

@app.route("/api/name_available", methods=["POST"])
def name_available():
	if "/" in request.json['name'] or "\\" in request.json['name']:
		return jsonify({'available': False, 'reason': Errors.forbidden_character.name})
	if request.json['name'] in users.keys():
		return jsonify({'available': False, 'reason': Errors.name_already_taken.name})
	user_folder = os.path.join("data", request.json['name'].lower().replace(" ", "-"))
	if os.path.exists(user_folder):
		return jsonify({'available': False, 'reason': Errors.creating_folder_error.name})
	return jsonify({'available': True})

def fast_login(user, password):
	if user in users.keys():
		if users[user]['password'] == password:
			return True
	return False

@app.route("/api/login", methods=["POST"])
def login():
	ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	x = BrootForceProtection(request.json['name'], request.json['password'], ip, fast_login)()
	if not x['successfully']:
		x['reason'] = Errors.incorrect_name_or_password.name

	return jsonify(x)

@app.route("/api/reset", methods=["POST"])
def reset():
	ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	x = BrootForceProtection(request.json['user'], request.json['old_password'], ip, fast_login)()
	if x['successfully']:
		users[request.json['user']]["password"] = request.json['new_password']
		save_users()
		return jsonify({'successfully': True})
	else:
		x['reason'] = Errors.incorrect_name_or_password.name
	return jsonify(x)

@app.route("/api/register", methods=["POST"])
def register():
	if "/" in request.json['name'] or "\\" in request.json['name']:
		return jsonify({'successfully': False, 'reason': Errors.forbidden_character.name})

	for i in request.json.values():
		if len(i.strip()) == 0:
			return jsonify({'successfully': False, 'reason': Errors.forbidden_character.name})
	
	if request.json['name'].lower() == "admin":
		return jsonify({'successfully': False, 'reason': Errors.name_already_taken.name})

	if request.json['name'] in users.keys():
		return jsonify({'successfully': False, 'reason': Errors.name_already_taken.name})

	try:
		user_folder = os.path.join("data", request.json['name'].lower().replace(" ", "-"))
		if not os.path.exists(user_folder):
			os.makedirs(user_folder)
			with open(os.path.join(user_folder, 'artist.json'), 'w', encoding='utf8') as file:
				file.write(htmlTemplates.atrist_config(request.json['name']))
			with open(os.path.join(user_folder, 'index.html'), 'w', encoding='utf8') as file:
				file.write(htmlTemplates.artist_index(request.json['name']))
		else:
			return jsonify({'successfully': False, 'reason': Errors.creating_folder_error.name})
	except:
		return jsonify({'successfully': False, 'reason': Errors.creating_folder_error.name})

	try:
		register_user(request.json)
	except:
		shutil.rmtree(user_folder)
		return jsonify({'successfully': False, 'reason': Errors.invalid_parameters.name})

	save_users()
	return jsonify({'successfully': True})


def parse_boolean(value):
	if value == True or value == "true" or value == "True":
		return True
	return False

def make_config(data, files):
	config = {}
	config["track_name"] = data["track_name"]
	config["artist"] = data["artist"]
	config["genre"] = data["genre"]
	config["main_img"] = files["image"].filename
	config["allow_download"] = parse_boolean(data["allow_download"])
	config["download_file"] = files["audio"].filename
	config["audio_preview"] = files["audio"].filename

	config["show_time"] = True
	config["animate_time"] = True

	links = {}
	hosts = ['spotify', 'youtube_music', 'youtube', 'apple_music', 'deezer', 'soundcloud', 'newgrounds']
	for i in hosts:
		if i in data.keys():
			links[i] = data[i]
	if links:
		config['links'] = links

	return config

def edit_config(data, old_data):
	old_data["genre"] = data["genre"]
	old_data["allow_download"] = parse_boolean(data["allow_download"])
	links = {}
	hosts = ['spotify', 'youtube_music', 'youtube', 'apple_music', 'deezer', 'soundcloud', 'newgrounds']
	for i in hosts:
		if i in data.keys():
			links[i] = data[i]
	if links:
		old_data['links'] = links
	return old_data


@app.route('/api/uploader', methods=['POST'])
def upload_file():
	if request.method == 'POST':
		ip = request.headers.get('X-Forwarded-For', request.remote_addr)
		x = BrootForceProtection(request.form['artist'], request.form['password'], ip, fast_login)()
		if x['successfully']:
			user_folder = os.path.join("data", request.form['artist'].lower().replace(" ", "-"))
			track_folder = os.path.join(user_folder, request.form['track_name'].lower().replace(" ", "-"))

			if os.path.exists(user_folder):
				if "/" in request.form['track_name'] or "\\" in request.form['track_name']:
					return jsonify({'successfully': False, 'reason': Errors.track_forbidden_character.name})
				if track_exists(request.form['artist'], request.form['track_name']):
					return jsonify({'successfully': False, 'reason': Errors.track_already_exists.name})

				if not os.path.exists(track_folder):
					os.makedirs(track_folder)

					for i in request.files:
						f = request.files[i]

						if f.mimetype.split('/')[0] == 'image':
							image_bytes = BytesIO(f.stream.read())
							blob = image_bytes.read()
							filesize = len(blob)
							if filesize <= 2097152:
								img = Image.open(image_bytes)
								w, h = img.size
								if w <= 1280 and h <= 1280:
									with open(os.path.join(track_folder, f.filename),'wb') as file:
										file.write(blob)
								else:
									shutil.rmtree(track_folder)
									return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})
							else:
								shutil.rmtree(track_folder)
								return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})

						elif f.mimetype.split('/')[0] == 'audio':
							_, extension = os.path.splitext(f.filename)
							if extension == ".mp3":
								audio_bytes = BytesIO(f.stream.read())
								blob = audio_bytes.read()
								filesize = len(blob)
								if filesize <= 10485760:
									metadata = audio_metadata.loads(blob)
									bitrate = metadata.streaminfo.bitrate / 1000
									if bitrate <= 192:
										with open(os.path.join(track_folder, f.filename),'wb') as file:
											file.write(blob)
									else:
										shutil.rmtree(track_folder)
										return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})
								else:
									shutil.rmtree(track_folder)
									return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})
							else:
								shutil.rmtree(track_folder)
								return jsonify({'successfully': False, 'reason': Errors.wrong_file_format.name})


					try:
						config = make_config(request.form.to_dict(), request.files.to_dict())
						with open(os.path.join(track_folder, 'config.json'), 'w', encoding='utf8') as file:
							file.write('config = ' + json.dumps(config, indent=4, ensure_ascii=False))

						with open(os.path.join(track_folder, 'index.html'), 'w', encoding='utf8') as file:
							file.write(htmlTemplates.track_index(request.form['artist'], request.form['track_name'], request.files['image'].filename))
						with open(os.path.join(track_folder, 'embed.html'), 'w', encoding='utf8') as file:
							file.write(htmlTemplates.track_embed())
					
						add_track(artist=request.form['artist'],
								track_name=request.form['track_name'],
								genre=request.form['genre'],
								image=request.files['image'].filename,
								date=request.form['release_date'])

						save_tracks()
						
						url = request.form['artist'].lower().replace(" ", "-") + "/" + request.form['track_name'].lower().replace(" ", "-")
						return jsonify({'successfully': True, 'url': url})

					except Exception as e:
						print(e)
						shutil.rmtree(track_folder)
						return jsonify({'successfully': False, 'reason': Errors.invalid_parameters.name})
			
			return jsonify({'successfully': False, 'reason': Errors.creating_folder_error.name})

		else:
			return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})



@app.route('/api/delete_track', methods=['POST'])
def delete_track():
	if request.method == 'POST':
		ip = request.headers.get('X-Forwarded-For', request.remote_addr)
		x = BrootForceProtection(request.json['artist'], request.json['password'], ip, fast_login)()
		if x['successfully']:
			user_folder = os.path.join("data", request.json['artist'].lower().replace(" ", "-"))
			track_folder = os.path.join(user_folder, request.json['track_name'].lower().replace(" ", "-"))
			if os.path.exists(track_folder):
				shutil.rmtree(track_folder)
				if remove_track(request.json['artist'], request.json['track_name']):
					save_tracks()
				return jsonify({'successfully': True})
			else:
				return jsonify({'successfully': False, 'reason': Errors.track_dont_exists.name})
		else:
			return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})


@app.route('/api/get_profile_photo', methods=['POST'])
def get_profile_photo():
	try:
		user_folder_public = request.json['artist'].lower().replace(" ", "-")
		user_folder = os.path.join("data", user_folder_public)

		try:
			with open(os.path.join(user_folder, "artist.json"), 'r', encoding='utf8') as file:
				lines = file.readlines()
				string = "".join(filter(lambda x: not "//" in x, lines)) # remove comments
				string = string.split('=', 1)[1]
				artist_settings = json.loads(string)
			
			return jsonify({'successfully': True, 'image': 
				os.path.normpath(os.path.join(user_folder_public, artist_settings['image']))
				})
		except:
			return jsonify({'successfully': True, 'image': 
				os.path.normpath(os.path.join(user_folder_public, "../root_/images/people.svg"))
				})
	except:
		return jsonify({'successfully': False, 'reason': Errors.invalid_parameters.name})

@app.route('/api/change_profile_photo', methods=['POST'])
def change_profile_photo():
	if request.method == 'POST':
		ip = request.headers.get('X-Forwarded-For', request.remote_addr)
		x = BrootForceProtection(request.form['artist'], request.form['password'], ip, fast_login)()
		if x['successfully']:
			user_folder = os.path.join("data", request.form['artist'].lower().replace(" ", "-"))
			try:
				with open(os.path.join(user_folder, "artist.json"), 'r', encoding='utf8') as file:
					lines = file.readlines()
					string = "".join(filter(lambda x: not "//" in x, lines)) # remove comments
					string = string.split('=', 1)[1]
					artist_settings = json.loads(string)

				image_path = os.path.normpath(os.path.join(os.path.abspath(user_folder), artist_settings['image']))

				if 'delete' in request.form.keys():
					artist_settings_image = "../root_/images/people.svg" # default
					if os.path.isfile(image_path):
						os.remove(image_path)
				else:
					f = request.files['image']
					if f.mimetype.split('/')[0] == 'image':
						image_bytes = BytesIO(f.stream.read())
						blob = image_bytes.read()
						filesize = len(blob)
						if filesize <= 2097152:
							img = Image.open(image_bytes)
							w, h = img.size
							if w <= 1280 and h <= 1280:
								if os.path.isfile(image_path):
									os.remove(image_path)
								with open(os.path.join(user_folder, f.filename),'wb') as file:
									file.write(blob)
								artist_settings_image = f.filename
							else:
								return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})
						else:
							return jsonify({'successfully': False, 'reason': Errors.file_is_too_big.name})
					else:
						return jsonify({'successfully': False, 'reason': Errors.wrong_file_format.name})

				with open(os.path.join(user_folder, 'artist.json'), 'w', encoding='utf8') as file:
					file.write(htmlTemplates.atrist_config(
						request.form['artist'],
						artist_settings_image
					))
				with open(os.path.join(user_folder, 'index.html'), 'w', encoding='utf8') as file:
					file.write(htmlTemplates.artist_index(
						request.form['artist'],
						artist_settings_image
					))

				return jsonify({'successfully': True})
			
			except:
				return jsonify({'successfully': False, 'reason': Errors.error_working_files.name})
			
			return jsonify({'successfully': True})
		else:
			return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})


def get_track_info_json(path, other_track_info):
	with open(path, 'r', encoding='utf8') as file:
		lines = file.readlines()
		string = "".join(filter(lambda x: x.strip()[:2] != "//", lines)) # remove comments
		string = string.split('=', 1)[1]
		config = json.loads(string)
		config['date'] = other_track_info['date']
	return config

@app.route('/api/get_track_info', methods=['POST'])
def get_track_info():
	try:
		if track_exists(request.json['artist'], request.json['track']):
			try:
				user_folder = os.path.join("data", request.json['artist'].lower().replace(" ", "-"))
				track_folder = os.path.join(user_folder, request.json['track'].lower().replace(" ", "-"))
				track_inf = tracks[request.json['artist']]['tracks'][request.json['track']]
				config = get_track_info_json(os.path.join(track_folder, 'config.json'), track_inf)
				return jsonify({'successfully': True, 'config': config})
			except:
				return jsonify({'successfully': False, 'reason': Errors.error_working_files.name})
		else:
			return jsonify({'successfully': False, 'reason': Errors.track_dont_exists.name})
	except:
		return jsonify({'successfully': False, 'reason': Errors.invalid_parameters.name})

@app.route('/api/edit_track', methods=['POST'])
def edit_track_api():
	if request.method == 'POST':
		ip = request.headers.get('X-Forwarded-For', request.remote_addr)
		x = BrootForceProtection(request.form['artist'], request.form['password'], ip, fast_login)()
		if x['successfully']:
			user_folder = os.path.join("data", request.form['artist'].lower().replace(" ", "-"))
			track_folder = os.path.join(user_folder, request.form['track_name'].lower().replace(" ", "-"))

			if os.path.exists(track_folder):
				try:
					track_inf = tracks[request.form['artist']]['tracks'][request.form['track_name']]
					old_config = get_track_info_json(os.path.join(track_folder, 'config.json'), track_inf)

					config = edit_config(request.form.to_dict(), old_config)
					with open(os.path.join(track_folder, 'config.json'), 'w', encoding='utf8') as file:
						file.write('config = ' + json.dumps(config, indent=4, ensure_ascii=False))
				
					edit_track(artist=request.form['artist'],
							track_name=request.form['track_name'],
							genre=request.form['genre'],
							date=request.form['release_date'])

					save_tracks()
					
					url = request.form['artist'].lower().replace(" ", "-") + "/" + request.form['track_name'].lower().replace(" ", "-")
					return jsonify({'successfully': True, 'url': url})

				except Exception as e:
					print(e)
					return jsonify({'successfully': False, 'reason': Errors.invalid_parameters.name})
			
			return jsonify({'successfully': False, 'reason': Errors.error_working_files.name})

		else:
			return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})


@app.route('/api/get_user_profile', methods=['POST'])
def get_user_profile():
	ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	x = BrootForceProtection(request.json['name'], request.json['password'], ip, fast_login)()
	if x['successfully']:
		if request.json['name'] in users.keys():
			temp = dict(users[request.json['name']])
			del temp['password']
			del temp['registration_time']
			return jsonify({'successfully': True, 'data': temp})
		else:
			return jsonify({'successfully': False, 'reason': Errors.user_dont_exist.name})
	else:
		return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})

@app.route('/api/get_user_profile_public', methods=['POST'])
def get_user_profile_public():
	if request.json['user'] in users.keys():
		temp = dict(users[request.json['user']])
		public_fields = {}
		if "public_fields" in temp.keys():
			for i in temp["public_fields"]:
				try: public_fields[i] = temp[i]
				except: pass
		return jsonify({'successfully': True, "public_fields": public_fields})
	else:
		return jsonify({'successfully': False, 'reason': Errors.user_dont_exist.name})

@app.route('/api/edit_user_profile', methods=['POST'])
def edit_user_profile():
	ip = request.headers.get('X-Forwarded-For', request.remote_addr)
	x = BrootForceProtection(request.json['name'], request.json['password'], ip, fast_login)()
	if x['successfully']:
		if request.json['name'] in users.keys():
			edit_user(request.json['name'], request.json)
			save_users()
			return jsonify({'successfully': True})
		else:
			return jsonify({'successfully': False, 'reason': Errors.user_dont_exist.name})
	else:
		return jsonify({'successfully': False, 'reason': Errors.incorrect_name_or_password.name})



if __name__ == '__main__':
	# app.run(debug=True)
	app.run(host='0.0.0.0', port='80')
