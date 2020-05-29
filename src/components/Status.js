import React from 'react';
import { Icon, Message } from 'semantic-ui-react';

const Status = ( { loading, error, data } ) => {
	return (
		<div className='status'>
			{ loading && (
				<Message icon size='mini'>
					<Icon name='circle notched' loading/>
					<Message.Content>
						<Message.Header>Loading...</Message.Header>
					</Message.Content>
				</Message>
			) }
			{ error && (
				<Message error size='mini'>
					<Message.Header>Error!</Message.Header>
					<Message.Content>
						Please see the log stream for further information
					</Message.Content>
				</Message>
			) }
			{ data && (
				<Message positive size='mini'>
					<Message.Header>Success!</Message.Header>
				</Message>
			) }
		</div>
	);
};

export default Status;