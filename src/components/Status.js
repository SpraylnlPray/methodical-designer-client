import React from 'react';
import { Icon, Message } from 'semantic-ui-react';
// todo: add error output for more than just graphql errors

const Status = ( { loading, error, data } ) => {
	let errors = {};
	if ( error ) {
		errors = error.graphQLErrors.map( ( { message }, i ) => (
			<li className='content' key={ i }>{ message }</li>
		) );
	}
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
						{errors}
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