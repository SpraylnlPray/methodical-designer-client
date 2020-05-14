import React, { useReducer } from 'react';
import { Container, Form, Header } from 'semantic-ui-react';
import Status from './Status';
import { inputReducer } from '../InputReducer';
import { useMutation } from '@apollo/client';
import { CREATE_LOCAL_NODE } from '../queries/LocalMutations';
import { enteredRequired } from '../utils';
import { typeOptions } from '../nodeOptions';

function CreateNode( props ) {
	const inputs = { required: { label: '', type: '' }, props: { story: '', synchronous: false, unreliable: false } };

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs, justMutated: false },
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
			runMutation( {
				variables: {
					...store.required,
					props: store.props,
				},
			} )
				.catch( e => console.log( e ) );
		}
		else {
			console.log( 'Must provide required inputs!' );
			alert( 'Must provide required inputs!' );
		}
	};

	return (
		<Container>
			<Header as='h2'>Create a Node!</Header>
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
					<Form.Select
						className='create-required-select create-input'
						fluid
						clearable
						label='Type'
						options={ typeOptions }
						placeholder='Type'
						onChange={ handleRequiredChange }
						required
						name='type'
						value={ store.required['type'] }
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
				<Form.Button onClick={ handleSubmit }>Create!</Form.Button>
			</Form>
			<Status data={ data } error={ error } loading={ loading }/>
		</Container>
	);
}

export default CreateNode;
