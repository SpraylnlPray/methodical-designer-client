import React, { useEffect } from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import './css/App.css';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import LogStream from './components/LogStream';
import { addLogMessage, setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import { SET_LINKS, SET_NODES } from './queries/LocalMutations';

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		setActiveItem( client, 'app', 'app' );
	};

	const [ setNodes ] = useMutation( SET_NODES );
	const [ setLinks ] = useMutation( SET_LINKS );

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

	useEffect( () => {
		setWindowSize();
	}, [] );

	const setWindowSize = () => {
		const w = Math.max( document.documentElement.clientWidth, window.innerWidth || 0 );
		const h = Math.max( document.documentElement.clientHeight, window.innerHeight || 0 );
		document.getElementById( 'root' ).style.height = h.toString() + 'px';
		document.getElementById( 'root' ).style.width = w.toString() + 'px';
	}

	return (
		<div className='bordered app margin-base main-grid' onClick={handleClick}>
			<HeaderArea client={client} />
			<InteractionPane client={client} />
			<EditorPane />
			<LogStream />
			<div className='version'>
				v2.21
			</div>
		</div>
	);
}

export default App;
