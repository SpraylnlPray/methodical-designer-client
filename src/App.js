import React from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import LogStream from './components/LogStream';
import { addLogMessage, setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import ServerStartupMessage from './components/ServerStartupMessage';
import { SET_LINKS, SET_NODES } from './queries/LocalMutations';

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		setActiveItem( client, 'app', 'app' );
	};

	const [ setNodes ] = useMutation( SET_NODES );
	const [ setLinks ] = useMutation( SET_LINKS );

	const { data: serverNodeData, startPolling: startNodePolling, stopPolling: stopNodePolling }
					= useQuery( GET_SERVER_NODES, {
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error.message ),
		onCompleted: data => {
			setNodes( { variables: { nodes: data.Nodes } } )
				.catch( error => addLogMessage( client, 'Error when setting local nodes: ' + error.message ) );
		},
	} );
	const { data: serverLinkData, startPolling: startLinkPolling, stopPolling: stopLinkPolling }
					= useQuery( GET_SERVER_LINKS, {
		onError: error => addLogMessage( client, 'Error when pulling server links: ' + error.message ),
		onCompleted: data => {
			// setTimeout( () => {
			setLinks( { variables: { links: data.Links } } )
				.catch( error => addLogMessage( client, 'Error when setting local links: ' + error.message ) );
			// }, 500 );
		},
	} );

	const EditorArea = () => {
		if ( serverNodeData && serverLinkData ) {
			stopNodePolling();
			stopLinkPolling();
			return (<EditorPane/>);
		}
		else {
			startNodePolling( 5000 );
			startLinkPolling( 5000 );

			return (<ServerStartupMessage/>);
		}
	};

	return (
		<div className='bordered app margin-base' onClick={ handleClick }>
			<HeaderArea client={ client }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane client={ client }/>
					</Grid.Column>
					<Grid.Column width={ 12 }>
						{/*{ EditorArea() }*/ }
						<EditorPane/>
					</Grid.Column>
				</Grid.Row>
			</Grid>
			<LogStream/>
			<div className='version'>
				v2.2b
			</div>
		</div>
	);
}

export default App;
