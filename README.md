# Swords and Ravens

"Swords and Ravens" is a reimplementation of the board game published by Fantasy Flight Games "A Game of Thrones: Board Game - Second Edition".

This repository also serves as a bug tracker. Head to [the issues section](../../issues) if you want to report a bug, see the progression on the different features, or to see what's planned for the game! Before creating an issue to report a bug or propose a feature, please make sure that an issue does not already exist by using the search functions.

Suggestions, remarks and other feedbacks can done on [the discord server](https://discord.gg/wWgCdvM) (Ask Tex for access to the feedback channel).

## General Architecture

The project is separated into 2 components:

* A website in `Python` with the `Django` framework. This component handles user registrations, creating games as well as joining them. It exposes a REST API used by the game server. Finally, it also contains the logic for the chat used in the games. The code is located in `agot-bg-website/`.
* A game server in `Typescript` with `React`, `mobx` and `bootstrap`. It runs the games of AGoT. It is itself composed of a front-end and a back-end. The code is located in `agot-bg-game-server/`.

Additional documentation about how those components work can be found in the folder of each component.

## How to Run

There a multiple ways to run the code, depending on what components on what you want to run.

### Launching the Game Only

Requires `NodeJS v14` and `yarn`. Install the dependencies and initialize the environment variables by executing:

```bash
cd agot-bg-game-server/
yarn install
yarn run generate-json-schemas
cp .env.dev.local .env
```

In 2 different terminals, execute:

* `yarn run run-client`
* `yarn run run-server`

Open `http://localhost:8080/static/#1` in your browser. Additional players can be simulated by opening new browser tabs and changing the number at the end of the url.

Closing and re-reunning `run-server` will create a new game.

**Note**: The chat, which is managed by the website, will not be available.

### Launching the Website Only

Requires a Linux based OS, `docker` and `python3`.\
_If you are on Windows you can install WSL2 to make it work. The project runs fine with the default Ubuntu distribution.
Just enable Docker Desktop to be accessed from WSL if it's not activated per default._

Make sure following packages are installed on your OS:

```bash
sudo apt-get install gcc libpq-dev -y
sudo apt-get install python-dev  python-pip -y
sudo apt-get install python3-dev python3-pip python3-venv python3-wheel -y
```

To spin up the PostgreSQL database and a Redis database, open a terminal and execute `docker-compose up`.

In `agot-bg-website/agotboardgame_main/migrations` remove all files except `__init__.py` `0001_initial.py`.\
_These deleted migration files are bound to the swordsandravens.net database and therefore
you have to create the necessary migrations for your newly created database on your own._

Install the dependencies of the website component, initialize the database and create a super user by running:

```bash
cd agot-bg-website/
cp .env.dev .env
python3 -m venv venv
source venv/bin/activate
pip install wheel
pip install -r requirements.txt
cp agotboardgame_main/migrations_for_new_database.py agotboardgame_main/migrations/0002_initial_migrations.py
python3 manage.py migrate
python3 manage.py createcachetable

# This command will ask for a password. Use "rootroot"
python3 manage.py createsuperuser --username Longwelwind
```

Once done, you can run the server by executing:

```bash
python3 manage.py runserver
```

The website will be accessible at `http://localhost:8000/`. Some functionalities such as mail notifications and social authentications will require environment variables defined in `.env`.\
As Google and Discord authentication is not available you can login via `http://localhost:8000/admin`.

**Note**: If you try to open a game via the website, you will land on a template page.

### Launching the Game and the Website

To launch the 2 components and make them inter-connected, make sure the dependencies are installed and the database is up and running (follow the instructions given in the precedent sections).

Replace the environment configuration of the game-server with a live one: `cp .env.dev.live .env`.

The front-end of the game server must be built and placed in the website. This can be done by executing `./build_and_place_game_client_into_django.sh`.

You can now run the game server and the website by launching, in 2 two different terminals:

* In `agot-bg-game-server/`, execute `yarn run run-server`.
* In `agot-bg-website/`, activate your venv and execute `python3 manage.py runserver`.

**Note**: For play testing you at least need another user to run the game variant "Teach the game" locally.
Create this user the same way you created the user Longwelwind.
