import { FormEventHandler, useEffect, useState } from 'react';
import { Routes, Route, Outlet, Link, useNavigate } from 'react-router-dom';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
// import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';

import '@aws-amplify/ui-react/styles.css';

const client = generateClient<Schema>();

function Home() {
	return (
		<>
			<h1>8-Bit Club</h1>
			<p>
				Find local events where you can play your favorite classic arcade games
				with friends. See where your favorite games are around town, and set up
				times to play with your friends (coming soon!).
			</p>
			<p>
				<Link to="/games">Browse games &rarr;</Link>
			</p>
		</>
	);
}

function ListGames() {
	const [games, setGames] = useState<Array<Schema['Game']['type']>>([]);

	useEffect(() => {
		client.models.Game.observeQuery({
			selectionSet: ['id', 'name', 'description', 'locations.location.name'],
		}).subscribe({
			// @ts-expect-error TS2345
			next: (data) => setGames([...data.items]),
		});
	}, []);

	async function deleteGame(id: Schema['Game']['type']['id']) {
		await client.models.Game.delete({ id });
	}

	return (
		<>
			<a href="/game-create">Create New Game</a>

			<div className="items">
				{games.map((game) => {
					return (
						<div key={game.id} className="item">
							<h2>{game.name}</h2>
							<p>{game.description}</p>
							<p>
								Where to play:{' '}
								{game.locations
									// @ts-expect-error TS2339
									.filter((g) => g.location)
									// @ts-expect-error TS7006
									.map((g) => g.location.name)
									.join(', ')}
							</p>
							<button onClick={() => deleteGame(game.id)}>delete</button>
						</div>
					);
				})}
			</div>
		</>
	);
}

function CreateGame() {
	const navigate = useNavigate();

	const createGame: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

		const data = new FormData(event.currentTarget);

		const name = data.get('name') as string;
		const description = data.get('description') as string;

		if (!name || !description) {
			throw new Error('name and description are required!');
		}

		await client.models.Game.create({
			name,
			description,
		});

		navigate('/games');
	};

	return (
		<form method="POST" onSubmit={createGame}>
			<h1>Create Game</h1>

			<label htmlFor="name">Name</label>
			<input type="text" id="name" name="name" required />

			<label htmlFor="description">Description</label>
			<textarea id="description" name="description" required></textarea>

			<button type="submit">Create Game</button>
		</form>
	);
}

type LocationWithGames = Array<{
	id: string;
	name: string;
	games: Array<{
		game: {
			id: string;
			name: string;
			description: string;
			createdAt: string;
			updatedAt: string;
		};
	}>;
}>;

function ListLocations() {
	const [locations, setLocations] = useState<LocationWithGames>([]);

	useEffect(() => {
		client.models.Location.observeQuery({
			selectionSet: ['id', 'name', 'games.game.*'],
		}).subscribe({
			next: (data) => setLocations([...data.items] as LocationWithGames),
		});
	}, []);

	async function deleteLocation(id: Schema['Location']['type']['id']) {
		await client.models.Location.delete({ id });
	}

	return (
		<>
			<a href="/location/create">Create New Location</a>

			<div className="items">
				{locations.map((location) => {
					return (
						<div key={location.id} className="item">
							<h2>{location.name}</h2>
							<p>
								Games:{' '}
								{location.games
									// make sure the game ID still exists
									.filter((g) => g.game)
									.map((g) => g.game.name)
									.join(', ')}
							</p>
							<button onClick={() => deleteLocation(location.id)}>
								delete
							</button>
						</div>
					);
				})}
			</div>
		</>
	);
}

function CreateLocation() {
	const navigate = useNavigate();
	const [games, setGames] = useState<Array<Schema['Game']['type']>>([]);

	useEffect(() => {
		client.models.Game.observeQuery().subscribe({
			next: (data) => setGames([...data.items]),
		});
	}, []);

	const createLocation: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

		const data = new FormData(event.currentTarget);

		const name = data.get('name') as string;
		const selectedGames = data.getAll('games') as string[];

		if (!name || !selectedGames) {
			throw new Error('name and games are required!');
		}

		const { data: location } = await client.models.Location.create({
			name,
		});

		if (!location?.id) {
			console.error(location);
			throw new Error('invalid location');
		}

		selectedGames.forEach(async (gameId) => {
			await client.models.GameLocation.create({
				locationId: location.id,
				gameId,
			});
		});

		navigate('/locations');
	};

	return (
		<form method="POST" onSubmit={createLocation}>
			<h1>Create Location</h1>

			<label htmlFor="name">Name</label>
			<input type="text" id="name" name="name" required />

			<label htmlFor="description">Games</label>
			<select multiple id="games" name="games" required>
				{games.map((game) => (
					<option key={game.id} value={game.id}>
						{game.name}
					</option>
				))}
			</select>

			<button type="submit">Create Location</button>
		</form>
	);
}

function ListEvents() {
	return (
		<>
			<h1>TODO: List Events</h1>
		</>
	);
}

function CreateEvent() {
	return (
		<>
			<h1>TODO: Create Events</h1>
		</>
	);
}

function Layout() {
	return (
		<Authenticator>
			{({ signOut, user }) => (
				<>
					<header>
						<a rel="home" href="/">
							8-Bit Club
						</a>

						<nav>
							<Link to="/games">Games</Link>
							<Link to="/events">Events</Link>
							<Link to="/locations">Locations</Link>
						</nav>

						<div className="user">
							<p>signed in as {user?.signInDetails?.loginId}</p>

							<button onClick={signOut}>Sign out</button>
						</div>
					</header>
					<main>
						<Outlet />
					</main>
				</>
			)}
		</Authenticator>
	);
}

function App() {
	return (
		<Routes>
			<Route path="/" element={<Layout />}>
				<Route index element={<Home />} />

				<Route path="locations" element={<ListLocations />} />
				<Route path="events" element={<ListEvents />} />
				<Route path="games" element={<ListGames />} />

				<Route path="location/create" element={<CreateLocation />} />
				<Route path="event/create" element={<CreateEvent />} />
				<Route path="game-create" element={<CreateGame />} />

				<Route path="*" element={<h1>No match</h1>} />
			</Route>
		</Routes>
	);
}

export default App;
