import React, { useEffect, useReducer } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { LOCAL_NODES } from '../queries/LocalQueries';
import { Container, Form, Header } from 'semantic-ui-react';
import Status from './Status';
import { enteredRequired, setActiveItem } from '../utils';
import { inputReducer } from '../InputReducer';
import { DELETE_LOCAL_NODE, UPDATE_LOCAL_NODE } from '../queries/LocalMutations';
import { typeOptions } from '../nodeOptions';

const EditNode = ( { activeItem, client } ) => {

	const { data: { Nodes } } = useQuery( LOCAL_NODES );
	const { label, type, story, synchronous, unreliable } = Nodes.find( node => {
		return node.id === activeItem.itemId;
	} );
	const inputs = { required: { label, type }, props: { story, synchronous, unreliable } };

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs, justMutated: false },
	);

	useEffect( () => {
		dispatch( { type: 'UPDATE', data: inputs } );
	}, [ activeItem ] );

	const [ runUpdate, { data: updateData, loading: updateLoading, error: updateError } ] = useMutation( UPDATE_LOCAL_NODE );
	const [ runDelete ] = useMutation( DELETE_LOCAL_NODE );

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
			// in this query all entries are optional as they can be edited or not
			// at some point I'll have to refactor this on the server side
			let props = { ...store.props, ...store.required };
			let variables = { id: activeItem.itemId, props };
			runUpdate( { variables } )
				.catch( e => console.log( e ) );
		}
		else {
			console.log( 'Must provide required inputs!' );
			alert( 'Must provide required inputs!' );
		}
	};

	const handleDelete = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runDelete( { variables: { id: activeItem.itemId } } );
		setActiveItem( client, 'app', 'app' );
	};

	return (
		<Container>
			<Header as='h2'>Edit a Node!</Header>
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
				<Form.Button onClick={ handleSubmit }>Update!</Form.Button>
				<Form.Button onClick={ handleDelete }>Delete</Form.Button>
			</Form>
			<Status data={ updateData } error={ updateError } loading={ updateLoading }/>
		</Container>
	);
};

export default EditNode;