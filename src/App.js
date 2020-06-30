import React from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import './css/App.css';
import { useApolloClient, useLazyQuery, useMutation, useQuery } from '@apollo/client';
import LogStream from './components/LogStream';
import { addLogMessage, setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import { SET_LINKS, SET_NODES } from './queries/LocalMutations';
import { LAST_EDITOR_ACTIONS } from './queries/LocalQueries';
import { Button } from 'semantic-ui-react';

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		setActiveItem( client, 'app', 'app' );
	};

	const [ setNodes ] = useMutation( SET_NODES );
	const [ setLinks ] = useMutation( SET_LINKS );
	const [ getLastClicks ] = useLazyQuery( LAST_EDITOR_ACTIONS, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error.message ),
		onCompleted: data => {
			debugger
			console.log( data );
		},
	} );

	useQuery( GET_SERVER_NODES, {
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error.message ),
		onCompleted: data => {
			setNodes( { variables: { nodes: data.Nodes } } )
				.catch( error => addLogMessage( client, 'Error when setting local nodes: ' + error.message ) );
		},
	} );
	useQuery( GET_SERVER_LINKS, {
		onError: error => addLogMessage( client, 'Error when pulling server links: ' + error.message ),
		onCompleted: data => {
			setLinks( { variables: { links: data.Links } } )
				.catch( error => addLogMessage( client, 'Error when setting local links: ' + error.message ) );
		},
	} );

	return (
		<div className='bordered app margin-base main-grid' onClick={ handleClick }>
			<HeaderArea client={ client }/>
			<Button onClick={ getLastClicks }>
				Click me
			</Button>
			<InteractionPane client={ client }/>
			<EditorPane/>
			<LogStream/>
			<div className='version'>
				v2.2b
			</div>
		</div>
	);
}

export default App;
