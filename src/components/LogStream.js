import React, { useEffect, useRef, useState } from 'react';
import '../css/LogStream.css';
import { useApolloClient, useQuery } from '@apollo/client';
import { Button, Icon } from 'semantic-ui-react';
import { LOG_MESSAGES } from '../queries/LocalQueries';

function LogStream() {
	const client = useApolloClient();
	const [ visible, setVisible ] = useState( false );
	const { data } = useQuery( LOG_MESSAGES, {
		// adding a log message doesn't make sense here
		onError: err => console.log( 'error when reading log messages from cache: ' + err.message ),
	} );
	const messagesEndRef = useRef( null );

	const messageList = data.logMessages.map( ( message, i ) => (
		<li key={ i }>
			{ message }
		</li>
	) );

	const scrollToBottom = () => {
		if ( messagesEndRef.current ) {
			messagesEndRef.current.scrollIntoView( { behavior: 'smooth' } );
		}
	};

	const handleHeaderClick = ( e ) => {
		e.stopPropagation();
		setVisible( !visible );
	};

	const handleBodyClick = ( e ) => {
		e.stopPropagation();
	};

	const handleClearClick = ( e ) => {
		e.stopPropagation();
		client.writeQuery( {
			query: LOG_MESSAGES,
			data: {
				logMessages: [],
			},
		} );
	};

	useEffect( scrollToBottom, [ messageList ] );

	return (
		<div className='log-container'>
			<div className='header-container'>
				<Button className='log-header' onClick={ handleHeaderClick }>LogStream</Button>
				<Button className='trash-custom' onClick={ handleClearClick }>
					<Icon name='trash alternate'/>
				</Button>
			</div>
			{ visible &&
			<div>
				<ul className='log-stream overflow-managed' onClick={ handleBodyClick }>
					{ messageList }
					<div ref={ messagesEndRef }/>
				</ul>
			</div>
			}
		</div>
	);
}

export default LogStream;