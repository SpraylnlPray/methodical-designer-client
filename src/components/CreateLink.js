import React, { useEffect, useReducer } from 'react';
import { Container, Form } from 'semantic-ui-react';
import Status from './Status';
import { useMutation, useQuery } from '@apollo/client';
import { addLogMessage, enteredRequired } from '../utils';
import { EDITING_RIGHTS, LOCAL_NODES } from '../queries/LocalQueries';
import { CREATE_LOCAL_LINK } from '../queries/LocalMutations';
import { inputReducer } from '../InputReducer';
import { arrowOptions, typeOptions } from '../linkOptions';

function CreateLink( { client } ) {
	const { data: editingData } = useQuery( EDITING_RIGHTS );

	const inputs = {
		required: { label: '', type: '', x_id: '', y_id: '' },
		props: { story: '', optional: false },
		x_end: { arrow: '', note: '' },
		y_end: { arrow: '', note: '' },
		seq: { group: '', seq: '' },
	};

	const { data: { Nodes } } = useQuery( LOCAL_NODES );
	const nodeOptions = Nodes.map( node => ({ 'text': node.label, 'value': node.id }) );
	nodeOptions.sort( ( node1, node2 ) => node1.text < node2.text );

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);

	const [ runCreateLink, { data, loading, error } ] = useMutation( CREATE_LOCAL_LINK );

	const handleEndChange = ( e, data, xy ) => {
		const name = data.name;
		const value = data.value;
		dispatch( { type: `ADD_${ xy.toUpperCase() }_END`, name, value } );
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
			addLogMessage( client, `creating node` );
			const { required, props, x_end, y_end, seq } = store;
			const variables = { ...required, props, x_end, y_end, seq };
			runCreateLink( { variables } )
				.catch( e => console.log( e ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	const isPartOf = store.required['type'] === 'PartOf';
	useEffect( () => {
		dispatch( { type: 'ADD_X_END', name: 'arrow', value: 'Default' } );
		// eslint-disable-next-line
	}, [ isPartOf ] );

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
						floating
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
						floating
						clearable
						search
						selection
						className='create-required-select create-input'
						label={ isPartOf ? 'Parent-Node' : 'X-Node' }
						placeholder={ isPartOf ? 'Parent-Node' : 'X-Node' }
						required
						onChange={ handleRequiredChange }
						options={ nodeOptions }
						name='x_id'
						value={ store.required['x_id'] }
					/>
					<Form.Dropdown
						fluid
						floating
						clearable
						search
						selection
						className='create-required-select create-input'
						label={ isPartOf ? 'Parent-Arrow' : 'X-Arrow' }
						placeholder={ isPartOf ? 'Parent-Arrow' : 'X-Arrow' }
						name='arrow'
						value={ store.x_end['arrow'] }
						options={ arrowOptions }
						onChange={ ( e, data ) => handleEndChange( e, data, 'x' ) }
					/>
					<Form.Input
						fluid
						className='create-required-select create-input'
						label={ isPartOf ? 'Parent-Note' : 'X-Note' }
						placeholder={ isPartOf ? 'Parent-Note' : 'X-Note' }
						onChange={ ( e, data ) => handleEndChange( e, data, 'x' ) }
						name='note'
						value={ store.x_end['note'] }
					/>
					<Form.Dropdown
						fluid
						floating
						clearable
						search
						selection
						className='create-required-select create-input'
						label={ isPartOf ? 'Child-Node' : 'Y-Node' }
						placeholder={ isPartOf ? 'Child-Node' : 'Y-Node' }
						required
						onChange={ handleRequiredChange }
						options={ nodeOptions }
						name='y_id'
						value={ store.required['y_id'] }
					/>
					<Form.Dropdown
						fluid
						floating
						clearable
						search
						selection
						className='create-required-select create-input'
						label={ isPartOf ? 'Child-Arrow' : 'Y-Arrow' }
						placeholder={ isPartOf ? 'Child-Arrow' : 'Y-Arrow' }
						name='arrow'
						value={ store.y_end['arrow'] }
						options={ arrowOptions }
						onChange={ ( e, data ) => handleEndChange( e, data, 'y' ) }
					/>
					<Form.Input
						fluid
						className='create-required-select create-input'
						label={ isPartOf ? 'Child-Note' : 'Y-Note' }
						placeholder={ isPartOf ? 'Child-Note' : 'Y-Note' }
						onChange={ ( e, data ) => handleEndChange( e, data, 'y' ) }
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
				{/* if the user doesn't have editing rights, it should be disabled */ }
				<Form.Button color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Form.Button>
			</Form>
			<Status data={ data } error={ error } loading={ loading }/>
		</Container>
	);
}

export default CreateLink;
