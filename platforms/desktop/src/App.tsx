import "./App.css";
import Client from "client";
import { getDefaultInject } from "client/src/inject";

function App() {
	return (
		<div className="container">
			<Client platform="desktop" inject={getDefaultInject()} />
		</div>
	);
}

export default App;
