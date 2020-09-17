const options = {
	layout: {
		improvedLayout: true,
	},
	edges: {
		color: '#000000',
		physics: true,
		width: 2,
		smooth: {
			enabled: false,
		},
		font: {
			size: 12,
			align: 'middle',
		},
		arrows: {
			to: { enabled: false },
			from: { enabled: false },
		},
	},
	nodes: {
		physics: false,
		widthConstraint: {
			minimum: 25,
			maximum: 50,
		},
		chosen: {
			label: function ( values, id, selected, hovering ) {
				values.color = '#4DC4FF';
			}
		}
	},
	height: '100%',
	autoResize: true,
	interaction: {
		hoverConnectedEdges: false,
		selectConnectedEdges: false,
	},
	physics: {
		enabled: true,
	},
};

export default options;

