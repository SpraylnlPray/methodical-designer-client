import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { Divider, Button } from 'semantic-ui-react';
import { LOG_MESSAGES } from '../queries/LocalQueries';

function LogStream() {
	const [ visible, setVisible ] = useState( false );
	const { data } = useQuery( LOG_MESSAGES );
	const messagesEndRef = useRef( null );

	const messageList = data.logMessages.map( ( message, i ) => (
		<li key={ i }>
			{ message }
		</li>
	) );

	const scrollToBottom = () => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView( { behavior: 'smooth' } );
		}
	};

	const handleClick = ( e ) => {
		e.stopPropagation();
		setVisible( !visible );
	};

	useEffect( scrollToBottom, [ messageList ] );

	return (
		<div className='log-container'>
			<Button onClick={ handleClick } className='log-header'>LogStream</Button>
			{ visible &&
			<div>
				<ul className='log-stream overflow-managed'>
					{ messageList }
					<div ref={ messagesEndRef }/>
				</ul>
			</div>
			}
		</div>
	);
}

export default LogStream;