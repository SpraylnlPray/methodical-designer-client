import React, { useReducer } from 'react';
import { Container, Form } from 'semantic-ui-react';
import Status from './Status';
import { inputReducer } from '../InputReducer';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_LOCAL_NODE } from '../queries/LocalMutations';
import { addLogMessage, enteredRequired } from '../utils';
import { typeOptions } from '../nodeOptions';
import { EDITING_RIGHTS } from '../queries/LocalQueries';

function CreateNode( { client } ) {
	const { data: editingData } = useQuery( EDITING_RIGHTS );
	const inputs = { required: { label: '', nodeType: '' }, props: { story: '', synchronous: false, unreliable: false } };

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);
	const [ runMutation, { data, loading, error } ] = useMutation( CREATE_LOCAL_NODE );

	const handleRequiredChange = ( e, data ) => {
		const name = data.name;
		const value = data.type === 'checkbox' ? data.checked : data.value;
		dispatch( { type: 'ADD_REQUIRED', name, value } );
	};

	const handlePropsChange = ( e, data ) => {
		const name = data.name;
		const value = data.type === 'checkbox' ? data.checked : data.value;
		dispatch( { type: 'ADD_PROPS', name, value } );
	};

	const handleSubmit = ( e ) => {
		e.preventDefault();
		if ( enteredRequired( store.required ) ) {
			addLogMessage( client, `creating node` );
			runMutation( {
				variables: {
					...store.required,
					props: store.props,
				},
			} )
				.catch( e => addLogMessage( client, 'Failed when creating node: ' + e.message ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	return (
		<Container>
			<Form className='create-form'>
				<Form.Group className='create-group'>
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Label'
						placeholder='Label'
						onChange={ handleRequiredChange }
						required
						name='label'
						value={ store.required['label'] }
					/>
					<Form.Dropdown
						className='create-required-select create-input'
						fluid
						clearable
						floating
						search
						selection
						label='Type'
						options={ typeOptions }
						placeholder='Type'
						onChange={ handleRequiredChange }
						required
						name='nodeType'
						value={ store.required['nodeType'] }
					/>
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Story'
						placeholder='Story'
						onChange={ handlePropsChange }
						name='story'
						value={ store.props['story'] }
					/>
					<Form.Checkbox
						className='create-input'
						label='Synchronous'
						onChange={ handlePropsChange }
						checked={ store.props['synchronous'] }
						name='synchronous'
					/>
					<Form.Checkbox
						className='create-input'
						label='Unreliable'
						onChange={ handlePropsChange }
						checked={ store.props['unreliable'] }
						name='unreliable'
					/>
				</Form.Group>
				<Form.Button color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Form.Button>
			</Form>
			<Status data={ data } error={ error } loading={ loading }/>
		</Container>
	);
}

export default CreateNode;
