import React, { useReducer } from 'react';
import { Container, Form, Header } from 'semantic-ui-react';
import Status from './Status';
import { useMutation, useQuery } from '@apollo/client';
import { enteredRequired } from '../utils';
import { LOCAL_NODES } from '../queries/LocalQueries';
import { CREATE_LOCAL_LINK } from '../queries/LocalMutations';
import { inputReducer } from '../InputReducer';
import { arrowOptions, typeOptions } from '../linkOptions';

function CreateLink( props ) {
	const inputs = {
		required: { label: '', type: '', x_id: '', y_id: '' },
		props: { story: '', optional: false },
		x_end: { arrow: '', note: '' },
		y_end: { arrow: '', note: '' },
		seq: { group: '', seq: '' },
	};

	const { data: { Nodes } } = useQuery( LOCAL_NODES );
	const nodeOptions = Nodes.map( node => ({ 'text': node.label, 'value': node.id }) );

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);

	const [ runCreateLink, { data, loading, error } ] = useMutation( CREATE_LOCAL_LINK );

	const handleEndChange = ( e, data ) => {
		const name = data.name;
		const value = data.value;
		if ( data.placeholder.toLowerCase().includes( 'x' ) ) {
			dispatch( { type: 'ADD_X_END', name, value } );
		}
		else if ( data.placeholder.toLowerCase().includes( 'y' ) ) {
			dispatch( { type: 'ADD_Y_END', name, value } );
		}
	};

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

	const handleSeqChange = ( e, data ) => {
		const name = data.name;
		const value = data.value;
		dispatch( { type: 'ADD_SEQ', name, value } );
	};

	const handleSubmit = ( e ) => {
		e.preventDefault();
		if ( enteredRequired( store.required ) ) {
			const { required, props, x_end, y_end, seq } = store;
			const variables = { ...required, props, x_end, y_end, seq };
			runCreateLink( { variables } )
				.catch( e => console.log( e ) );
		}
		else {
			console.log( 'Must provide required inputs!' );
			alert( 'Must provide required inputs!' );
		}
	};

	return (
		<Container>
			<Header as='h2'>Create a Link!</Header>
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
						search
						selection
						label='Type'
						options={ typeOptions }
						placeholder='Type'
						onChange={ handleRequiredChange }
						required
						name='type'
						value={ store.required['type'] }
					/>
					<Form.Dropdown
						fluid
						clearable
						search
						selection
						className='create-required-select create-input'
						label='X-Node'
						placeholder='X-Node'
						required
						onChange={ handleRequiredChange }
						options={ nodeOptions }
						name='x_id'
						value={ store.required['x_id'] }
					/>
					<Form.Dropdown
						fluid
						clearable
						search
						selection
						className='create-required-select create-input'
						label='X-Arrow'
						placeholder='X-Arrow'
						name='arrow'
						value={ store.x_end['arrow'] }
						options={ arrowOptions }
						onChange={ handleEndChange }
					/>
					<Form.Input
						fluid
						className='create-required-select create-input'
						label='X-Note'
						placeholder='X-Note'
						onChange={ handleEndChange }
						name='note'
						value={ store.x_end['note'] }
					/>
					<Form.Dropdown
						fluid
						clearable
						search
						selection
						className='create-required-select create-input'
						label='Y-Node'
						placeholder='Y-Node'
						required
						onChange={ handleRequiredChange }
						options={ nodeOptions }
						name='y_id'
						value={ store.required['y_id'] }
					/>
					<Form.Dropdown
						fluid
						clearable
						search
						selection
						className='create-required-select create-input'
						label='Y-Arrow'
						placeholder='Y-Arrow'
						name='arrow'
						value={ store.y_end['arrow'] }
						options={ arrowOptions }
						onChange={ handleEndChange }
					/>
					<Form.Input
						fluid
						className='create-required-select create-input'
						label='Y-Note'
						placeholder='Y-Note'
						onChange={ handleEndChange }
						name='note'
						value={ store.y_end['note'] }
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
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Sequence Group'
						placeholder='Group'
						onChange={ handleSeqChange }
						name='group'
						value={ store.seq['group'] }
					/>
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Sequence Number'
						placeholder='0'
						onChange={ handleSeqChange }
						name='seq'
						value={ store.seq['seq'] }
					/>
					<Form.Checkbox
						className='create-input'
						label='optional'
						onChange={ handlePropsChange }
						checked={ store.props['optional'] }
						name='optional'
					/>
				</Form.Group>
				<Form.Button onClick={ handleSubmit }>Create!</Form.Button>
			</Form>
			<Status data={ data } error={ error } loading={ loading }/>
		</Container>
	);
}

export default CreateLink;
