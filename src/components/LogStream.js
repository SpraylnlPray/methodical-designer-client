import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button } from 'semantic-ui-react';
import { LOG_MESSAGES } from '../queries/LocalQueries';

function LogStream() {
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

	useEffect( scrollToBottom, [ messageList ] );

	return (
		<div className='log-container'>
			<Button onClick={ handleHeaderClick } className='log-header'>LogStream</Button>
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