import { useState } from "react";
import { AssociatedProgressEvent, OutputMessageEvent } from "../../types";
import "./LaunchConsole.css";
import { svg } from "components";

function LaunchConsole({ messages }: LaunchConsoleProps) {
	const [expanded, setExpanded] = useState(false);

	let messagesMapped: JSX.Element[] = [];
	for (let i = 0; i < messages.length; i++) {
		const isLast = i === messages.length - 1;
		messagesMapped.push(
			<div className={`consoleMessage ${isLast ? "last" : ""}`}>
				{messages[i]}
			</div>
		);
	}
	const latestMessage = messagesMapped[messagesMapped.length - 1];

	return (
		<div className="launchConsole">
			<div
				className="container launchConsoleHeader"
				onClick={() => {
					if (expanded) {
						setExpanded(false);
					} else {
						setExpanded(true);
					}
				}}
			>
				<div className="launchConsoleTitle">Console</div>
				<div className="launchConsoleLatest">{latestMessage}</div>
				<div
					className="container"
					style={{ justifyContent: "right", paddingRight: "1rem" }}
				>
					<svg.Right
						className={`launchConsoleArrow ${expanded ? "open" : ""}`}
					/>
				</div>
			</div>
			{expanded && (
				<div className="launchConsoleExpanded">{messagesMapped}</div>
			)}
		</div>
	);
}

export interface LaunchConsoleProps {
	messages: string[];
}

export function createDefaultMessage(event: OutputMessageEvent) {
	return event;
}

export function createProgressBar(event: AssociatedProgressEvent) {
	return `(${event.current}/${event.total}) ${event.message}`;
}

function consoleMessage(msg: string) {
	return;
}

export default LaunchConsole;
