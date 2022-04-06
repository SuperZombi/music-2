import sys, os
import shutil
import json

args = sys.argv[1:]

def help_():
	print(f'''

Admin Console Commands:

-dt $user $track
	Delete track

-du $user
	Delete user
''')

def delete_track(user, track_name):
	user_folder = os.path.join("data", user.lower().replace(" ", "-"))
	track_folder = os.path.join(user_folder, track_name.lower().replace(" ", "-"))
	shutil.rmtree(track_folder)

	with open(os.path.join('data', 'root_', 'bd.json'), 'r', encoding='utf8') as file:
		string = file.read()
		string = string.split('=', 1)[1]
		tracks = json.loads(string)

	del tracks[user]['tracks'][track_name]

	with open(os.path.join('data', 'root_', 'bd.json'), 'w', encoding='utf8') as file:
		file.write('bd = ' + json.dumps(tracks, indent=4, ensure_ascii=False))


def delete_user(user):
	user_folder = os.path.join("data", user.lower().replace(" ", "-"))
	shutil.rmtree(user_folder)

	with open(os.path.join('data', 'root_', 'bd.json'), 'r', encoding='utf8') as file:
		string = file.read()
		string = string.split('=', 1)[1]
		tracks = json.loads(string)

	del tracks[user]

	with open(os.path.join('data', 'root_', 'bd.json'), 'w', encoding='utf8') as file:
		file.write('bd = ' + json.dumps(tracks, indent=4, ensure_ascii=False))

	with open('users.bd', 'r', encoding='utf8') as file:
		users = json.loads(file.read())

	del users[user]

	with open('users.bd', 'w', encoding='utf8') as file:
		file.write(json.dumps(users, indent=4, ensure_ascii=False))


if len(args) > 0:
	if args[0] == "-dt":
		delete_track(*args[1:])

	elif args[0] == "-du":
		delete_user(args[1])

	else:
		help_()
else:
	help_()