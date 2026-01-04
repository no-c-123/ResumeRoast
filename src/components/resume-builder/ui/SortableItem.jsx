import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableItem = ({ id, children }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group">
            <div
                {...attributes}
                {...listeners}
                className="absolute left-[-20px] top-4 w-6 h-6 cursor-grab opacity-0 group-hover:opacity-100 flex items-center justify-center text-neutral-500 hover:text-white"
                title="Drag to reorder"
            >
                ⋮⋮
            </div>
            {children}
        </div>
    );
};
