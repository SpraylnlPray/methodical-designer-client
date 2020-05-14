import React, { useReducer } from 'react';
import { useMutation } from '@apollo/react-hooks';
import { enteredRequired } from '../utils';
import { inputReducer } from '../InputReducer';

const withFormHandling = ( FormComponent ) => {
	return function( { mutation, ...props } ) {
		const [ store, dispatch ] = useReducer(
			inputReducer,
			{ ...props.inputs },
		);

		const [ runMutation, { data, loading, error } ] = useMutation( mutation );

		const handleChange = ( e, data ) => {
			const name = data.name;
			const value = data.type === 'checkbox' ? data.checked : data.value;
			const required = !!data.required;
			dispatch( { type: 'ADD', required, name, value } );
		};

		const handleSubmit = ( e ) => {
			e.preventDefault();
			if ( enteredRequired( store.required ) ) {
				runMutation( { variables: { ...store.required, props: store.props } } )
					.catch( e => console.log( e ) );
			}
			else {
				console.log( 'Must provide required inputs!' );
				alert( 'Must provide required inputs!' );
			}
		};

		if ( data ) {
			props.refetch();
		}

		return (
			<FormComponent
				dispatch={ dispatch }
				props={ props }
				data={ data }
				loading={ loading }
				error={ error }
				store={ store }
				handleSubmit={ handleSubmit }
				handleChange={ handleChange }
			/>
		);
	};
};

export default withFormHandling;