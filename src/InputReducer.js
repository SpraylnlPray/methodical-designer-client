export const inputReducer = ( state, action ) => {
	switch ( action.type ) {

		case 'ADD_REQUIRED':
			let { required } = state;
			required[action.name] = action.value;
			return { ...state, required };

		case 'ADD_PROPS':
			let { props } = state;
			props[action.name] = action.value;
			return { ...state, props };

		case 'ADD_X_END':
			let { x_end } = state;
			x_end[action.name] = action.value;
			return { ...state, x_end };

		case 'ADD_Y_END':
			let { y_end } = state;
			y_end[action.name] = action.value;
			return { ...state, y_end };

		case 'ADD_SEQ':
			let { seq } = state;
			seq[action.name] = action.value;
			return { ...state, seq };

		case 'UPDATE':
			return { ...action.data };

		default:
			return state;
	}
};
