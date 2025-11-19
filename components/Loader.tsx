import React from 'react';

export const Loader: React.FC = () => {
	return (
		<div className="flex flex-col items-center justify-center text-center space-y-4">
			<div className="relative w-16 h-16">
				<div className="absolute top-0 left-0 w-full h-full border-4 border-neutral-800 rounded-full"></div>
				<div className="absolute top-0 left-0 w-full h-full border-t-4 border-orange-500 rounded-full animate-spin"></div>
			</div>
			<p className="text-neutral-400 font-medium">Generating Answer...</p>
		</div>
	);
};

export default Loader;