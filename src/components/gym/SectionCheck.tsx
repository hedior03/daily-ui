import { useStore } from '@nanostores/react';
import { persistentAtom } from '@nanostores/persistent';

interface SectionCheckProps {
	id: string;
	label: string;
	storageKey: string;
}

export default function SectionCheck({ id, label, storageKey }: SectionCheckProps) {
	const fullKey = `daily-ui:${storageKey}:${id}`;
	// We need to use a string for persistence as persistentAtom handles strings better
	// and we want to ensure it works across sessions.
	const $isChecked = persistentAtom<string>(fullKey, 'false');
	const isCheckedValue = useStore($isChecked);
	const isChecked = isCheckedValue === 'true';

	const handleChange = () => {
		$isChecked.set(isChecked ? 'false' : 'true');
	};

	return (
		<label 
			className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none
				${isChecked 
					? 'bg-primary/10 border-primary/30 text-primary' 
					: 'bg-muted border-(--color-border) text-muted-foreground hover:border-primary/50'
				}`}
		>
			<div className={`relative flex items-center justify-center w-5 h-5 rounded border transition-colors
				${isChecked 
					? 'bg-primary border-primary' 
					: 'bg-transparent border-muted-foreground/30 group-hover:border-primary/50'
				}`}
			>
				{isChecked && (
					<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
						<path d="M20 6 9 17l-5-5"/>
					</svg>
				)}
				<input 
					type="checkbox" 
					className="absolute opacity-0 w-full h-full cursor-pointer"
					checked={isChecked}
					onChange={handleChange}
				/>
			</div>
			<span className="font-medium">{label}</span>
		</label>
	);
}
